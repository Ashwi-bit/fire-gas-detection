// src/screens/AnalysisScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../services/firebaseConfig';

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
        <ActivityIndicator size="large" color="#d84b30" />
      </View>
    );
  }

  if (!values.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>
          No readings logged yet for the past 30 days. Once your Cloud Function starts
          writing to the "readings" collection, this chart fills in automatically.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Peak daily gas level — last 30 days</Text>
      <LineChart
        data={{
          labels: labels.length ? labels : ['-'],
          datasets: [{ data: values }],
        }}
        width={screenWidth - 32}
        height={240}
        yAxisSuffix=" ppm"
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(216, 75, 48, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(60, 60, 60, ${opacity})`,
          propsForDots: { r: '3' },
        }}
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  hint: { textAlign: 'center', color: '#888', fontSize: 14 },
});