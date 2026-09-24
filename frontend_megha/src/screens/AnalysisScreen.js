// src/screens/AnalysisScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';
import { colors, spacing, radius, type } from '../theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalysisScreen() {
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // readings collection: each doc = { gas, riskPercent, timestamp }
        // written by your Cloud Function every time it processes a sensor update
        const readingsRef = collection(firestore, 'readings');
        const q = query(
          readingsRef,
          where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('timestamp', 'asc')
        );
        const snapshot = await getDocs(q);

        // Group by day, take the max gas reading per day (peak matters most for safety)
        const dailyMax = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const day = d.timestamp.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          dailyMax[day] = Math.max(dailyMax[day] || 0, d.gas || 0);
        });

        const days = Object.keys(dailyMax);
        setLabels(days.length ? days.filter((_, i) => i % Math.ceil(days.length / 6) === 0) : []);
        setValues(Object.values(dailyMax));
      } catch (err) {
        console.error('Failed to load analysis data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.flame} />
      </View>
    );
  }

  if (!values.length) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
        <Text style={styles.hint}>
          No readings logged yet for the past 30 days. Once your Cloud Function starts
          writing to the "readings" collection, this chart fills in automatically.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Peak daily gas level</Text>
      <Text style={styles.subtitle}>Last 30 days</Text>
      <View style={styles.chartCard}>
        <LineChart
          data={{
            labels: labels.length ? labels : ['-'],
            datasets: [{ data: values }],
          }}
          width={screenWidth - 64}
          height={240}
          yAxisSuffix=" ppm"
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 90, 54, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(139, 147, 167, ${opacity})`,
            propsForDots: { r: '4', strokeWidth: '2', stroke: colors.glow },
            propsForBackgroundLines: { stroke: colors.border },
          }}
          bezier
          style={{ borderRadius: radius.md }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bg },
  title: { color: colors.textPrimary, ...type.h1, fontSize: 20, marginBottom: 2 },
  subtitle: { color: colors.textSecondary, ...type.small, marginBottom: spacing.md },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  hint: { textAlign: 'center', color: colors.textSecondary, ...type.body },
});
