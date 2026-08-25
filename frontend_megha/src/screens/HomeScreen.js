// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebaseConfig';

// Matches the ESP32's actual Realtime Database structure: /sensor/{temp, humidity, gas, flame}
const SENSOR_PATH = 'sensor';

function getRiskInfo(riskPercent) {
  if (riskPercent >= 70) return { label: 'Danger', color: '#c0392b', bg: '#fdecea' };
  if (riskPercent >= 35) return { label: 'Caution', color: '#b5750b', bg: '#fdf3e0' };
  return { label: 'Safe', color: '#2e7d32', bg: '#eaf5ea' };
}

export default function HomeScreen() {
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const sensorRef = ref(rtdb, SENSOR_PATH);
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const val = snapshot.val();
      setData(val);
      setLastUpdated(new Date());
    });
    return unsubscribe; // detaches the listener when screen unmounts
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // onValue is already live, this just gives pull-to-refresh a visual moment
    setTimeout(() => setRefreshing(false), 600);
  };

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Waiting for sensor data...</Text>
      </View>
    );
  }

  // NOTE: riskPercent should ideally be computed server-side (Cloud Function running
  // your ML model) and written back to this same node, e.g. data.riskPercent.
  // Placeholder fallback below so the screen works even before that's wired up.
  const riskPercent = data.riskPercent ?? Math.min(100, Math.round((data.gas || 0) / 10));
  const risk = getRiskInfo(riskPercent);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.riskCard, { backgroundColor: risk.bg }]}>
        <Text style={[styles.riskLabel, { color: risk.color }]}>{risk.label}</Text>
        <Text style={[styles.riskPercent, { color: risk.color }]}>{riskPercent}% risk</Text>
        {lastUpdated && (
          <Text style={styles.timestamp}>
            Updated {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.grid}>
        <SensorTile label="Gas (MQ2)" value={data.gas} unit="ppm" />
        <SensorTile label="Temperature" value={data.temp} unit="°C" />
        <SensorTile label="Humidity" value={data.humidity} unit="%" />
        <SensorTile
          label="Flame"
          value={data.flame === 1 ? 'Detected' : 'None'}
          unit=""
        />
      </View>
    </ScrollView>
  );
}

function SensorTile({ label, value, unit }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>
        {value ?? '--'} {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 15 },
  riskCard: { borderRadius: 12, padding: 20, marginBottom: 20 },
  riskLabel: { fontSize: 22, fontWeight: '700' },
  riskPercent: { fontSize: 16, marginTop: 4 },
  timestamp: { fontSize: 12, color: '#888', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tileLabel: { fontSize: 13, color: '#777', marginBottom: 6 },
  tileValue: { fontSize: 20, fontWeight: '600', color: '#222' },
});