import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebaseConfig';
import { colors, riskColors, spacing, radius, type } from '../theme';

export default function HomeScreen() {
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to latest sensor data — unchanged
  useEffect(() => {
    const sensorRef = ref(rtdb, 'sensor/latest');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to automatic prediction — unchanged
  useEffect(() => {
    const predictionRef = ref(rtdb, 'sensor/prediction');
    const unsubscribe = onValue(predictionRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPrediction(val);
        console.log('Auto Prediction:', val);
      }
    });
    return () => unsubscribe();
  }, []);

  const risk = riskColors[prediction?.risk_level] || riskColors.default;

  if (loading) {
    return (
      <View style={styles.centered}>
        <Image source={require('../../assets/logo.png')} style={styles.loadingLogo} />
        <Text style={styles.loadingText}>Waiting for live data…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Megha</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* HERO RISK CARD */}
      {prediction && (
        <View style={[styles.heroCard, { borderColor: risk.fg }]}>
          <View style={[styles.heroRing, { borderColor: risk.fg, backgroundColor: risk.bg }]}>
            <Ionicons name="shield-checkmark" size={30} color={risk.fg} />
            <Text style={[styles.heroPercent, { color: risk.fg }]}>{prediction.prediction}</Text>
          </View>
          <Text style={[styles.heroLevel, { color: risk.fg }]}>
            {prediction.risk_level} RISK
          </Text>
          <Text style={styles.heroTimestamp}>Updated {prediction.timestamp}</Text>
        </View>
      )}

      {/* SENSOR GRID */}
      {data && (
        <View style={styles.grid}>
          <MetricTile icon="flame" iconColor={colors.flame} label="Gas" value={`${data.gas} ppm`} />
          <MetricTile icon="thermometer" iconColor={colors.warn} label="Temperature" value={`${data.temp}°C`} />
          <MetricTile icon="water" iconColor={colors.glow} label="Humidity" value={`${data.humidity}%`} />
          <MetricTile
            icon="bonfire"
            iconColor={data.flame === 1 ? colors.critical : colors.safe}
            label="Flame"
            value={data.flame === 1 ? 'Detected' : 'None'}
          />
        </View>
      )}
    </ScrollView>
  );
}

function MetricTile({ icon, iconColor, label, value }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIconWrap, { borderColor: iconColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingLogo: { width: 72, height: 72, borderRadius: radius.lg, marginBottom: spacing.md },
  loadingText: { color: colors.textSecondary, ...type.body },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 34, height: 34, borderRadius: 9, marginRight: spacing.sm },
  headerTitle: { color: colors.textPrimary, ...type.h1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.safe, marginRight: 6 },
  liveText: { color: colors.textSecondary, ...type.small },

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroPercent: { ...type.hero, marginTop: 2 },
  heroLevel: { ...type.h2, letterSpacing: 1, marginBottom: 4 },
  heroTimestamp: { color: colors.textMuted, ...type.small },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { color: colors.textSecondary, ...type.label, marginBottom: 4 },
  tileValue: { color: colors.textPrimary, ...type.h2 },
});
