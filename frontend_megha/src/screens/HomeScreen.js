// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../services/firebaseConfig';

export default function HomeScreen() {
  const [sensorData, setSensorData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------- FIREBASE: LIVE SENSOR DATA ----------
  useEffect(() => {
    const sensorRef = ref(rtdb, 'sensor/latest');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setSensorData(val);
        setLastUpdated(new Date());
        console.log('✅ Sensor Data:', val);
      } else {
        setSensorData(null);
        console.log('⏳ No sensor data in Firebase');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ---------- FIREBASE: ML PREDICTION ----------
  useEffect(() => {
    const predictionRef = ref(rtdb, 'sensor/prediction');
    const unsubscribe = onValue(predictionRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setPrediction(val);
        console.log('✅ Prediction:', val);
      }
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // ---------- HELPER: RISK STYLING ----------
  const getRiskStyle = (riskLevel, predictionText) => {
    // Offline or No Data
    if (
      predictionText === 'Offline' ||
      predictionText === 'No Data' ||
      !predictionText
    ) {
      return {
        label: 'Offline',
        color: '#888888',
        bg: '#f0f0f0',
      };
    }

    switch (riskLevel) {
      case 'CRITICAL':
        return { label: 'CRITICAL', color: '#8B0000', bg: '#ffcccc' };
      case 'HIGH':
        return { label: 'HIGH RISK', color: '#c0392b', bg: '#fdecea' };
      case 'MEDIUM':
        return { label: 'Caution', color: '#b5750b', bg: '#fdf3e0' };
      case 'LOW':
        return { label: 'Safe', color: '#2e7d32', bg: '#eaf5ea' };
      default:
        return { label: 'Unknown', color: '#888888', bg: '#f0f0f0' };
    }
  };

  // ---------- LOADING STATE ----------
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>⏳ Loading...</Text>
      </View>
    );
  }

  // ---------- NO DATA STATE ----------
  const isOffline =
    !sensorData ||
    !prediction ||
    prediction.prediction === 'Offline' ||
    prediction.prediction === 'No Data';

  const riskStyle = getRiskStyle(
    prediction?.risk_level,
    prediction?.prediction
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ---------- HEADER ---------- */}
      <Text style={styles.header}>🔥 Fire & Gas Detection</Text>

      {/* ---------- RISK / PREDICTION CARD ---------- */}
      <View
        style={[
          styles.predictionCard,
          { backgroundColor: riskStyle.bg, borderColor: riskStyle.color },
        ]}
      >
        <Text style={styles.predictionLabel}>🤖 AI Prediction</Text>

        <Text style={[styles.predictionText, { color: riskStyle.color }]}>
          {prediction?.prediction || 'Waiting...'}
        </Text>

        <Text style={[styles.riskText, { color: riskStyle.color }]}>
          Risk Level: {riskStyle.label}
        </Text>

        {prediction?.timestamp && (
          <Text style={styles.timestamp}>
            Last updated: {prediction.timestamp}
          </Text>
        )}
      </View>

      {/* ---------- OFFLINE BANNER ---------- */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📡 ESP32 is offline — showing last known or no data
          </Text>
        </View>
      )}

      {/* ---------- SENSOR TILES ---------- */}
      {sensorData ? (
        <View style={styles.grid}>
          <SensorTile
            icon="🔥"
            label="Gas (MQ-2)"
            value={sensorData.gas ?? '--'}
            unit="ppm"
            alert={sensorData.gas > 2000}
          />
          <SensorTile
            icon="🌡️"
            label="Temperature"
            value={sensorData.temp ?? '--'}
            unit="°C"
          />
          <SensorTile
            icon="💧"
            label="Humidity"
            value={sensorData.humidity ?? '--'}
            unit="%"
          />
          <SensorTile
            icon="🔥"
            label="Flame"
            value={sensorData.flame === 1 ? 'Detected' : 'None'}
            unit=""
            alert={sensorData.flame === 1}
          />
        </View>
      ) : (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>
            No sensor data available
          </Text>
          <Text style={styles.noDataSub}>
            Make sure ESP32 is connected and sending data
          </Text>
        </View>
      )}

      {/* ---------- FOOTER ---------- */}
      {lastUpdated && (
        <Text style={styles.footer}>
          Sensor updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
    </ScrollView>
  );
}

// ==========================================================
// SENSOR TILE COMPONENT
// ==========================================================
function SensorTile({ icon, label, value, unit, alert = false }) {
  return (
    <View style={[styles.tile, alert && styles.tileAlert]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, alert && styles.tileValueAlert]}>
        {value} {unit}
      </Text>
    </View>
  );
}

// ==========================================================
// STYLES
// ==========================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // dark background
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },

  // HEADER
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    marginTop: 8,
  },

  // PREDICTION CARD
  predictionCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  predictionText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  riskText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
  },

  // OFFLINE BANNER
  offlineBanner: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  offlineText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },

  // SENSOR GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tileAlert: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  tileIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  tileValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tileValueAlert: {
    color: '#ef4444',
  },

  // NO DATA BOX
  noDataBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 6,
  },
  noDataSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },

  // FOOTER
  footer: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
});