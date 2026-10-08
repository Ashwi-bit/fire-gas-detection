// src/screens/AnalysisScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getHistory, getStats } from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function AnalysisScreen() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(365); // ✅ Default: All data

  const loadData = useCallback(async () => {
    try {
      console.log('Loading analysis for days:', days);
      const historyData = await getHistory(days, 1000);
      const statsData = await getStats(days);
      
      setHistory(historyData.data || []);
      setStats(statsData);
      
      console.log('✅ Loaded:', historyData.count, 'readings');
    } catch (error) {
      console.error('❌ Analysis load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Prepare chart data - last 15 readings
  const prepareChartData = (key) => {
    if (history.length === 0) return null;
    
    const recent = [...history].reverse().slice(-15);
    
    return {
      labels: recent.map((_, i) => (i % 3 === 0 ? `${i + 1}` : '')),
      datasets: [
        {
          data: recent.map((r) => r[key] || 0),
          color: (opacity = 1) => {
            if (key === 'gas') return `rgba(239, 68, 68, ${opacity})`;
            if (key === 'temp') return `rgba(245, 158, 11, ${opacity})`;
            return `rgba(59, 130, 246, ${opacity})`;
          },
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#1e293b',
    backgroundGradientFrom: '#1e293b',
    backgroundGradientTo: '#1e293b',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: { borderRadius: 12 },
    propsForDots: { r: '3', strokeWidth: '1' },
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  const gasData = prepareChartData('gas');
  const tempData = prepareChartData('temp');
  const humidityData = prepareChartData('humidity');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <Text style={styles.header}>📊 Analysis</Text>

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {[
          { v: 1, l: '1d' },
          { v: 3, l: '3d' },
          { v: 7, l: '7d' },
          { v: 30, l: '30d' },
          { v: 365, l: 'All' },
        ].map(({ v, l }) => (
          <TouchableOpacity
            key={v}
            style={[styles.rangeBtn, days === v && styles.rangeBtnActive]}
            onPress={() => setDays(v)}
          >
            <Text style={[styles.rangeBtnText, days === v && styles.rangeBtnTextActive]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* No data state */}
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>📭 No readings for this period</Text>
          <Text style={styles.emptySubText}>
            Try selecting a different time range (e.g., "All")
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Grid */}
          {stats && (
            <View style={styles.grid}>
              <StatCard label="Total Readings" value={stats.total_readings} icon="📈" />
              <StatCard
                label="Gas Leak Events"
                value={stats.gas_leak_events}
                icon="💨"
                alert={stats.gas_leak_events > 0}
              />
              <StatCard
                label="Flame Events"
                value={stats.flame_events}
                icon="🔥"
                alert={stats.flame_events > 0}
              />
              <StatCard
                label="Peak Gas"
                value={`${stats.max_gas}`}
                unit="ppm"
                icon="⬆️"
                alert={stats.max_gas > 2000}
              />
              <StatCard
                label="Avg Temp"
                value={stats.avg_temp}
                unit="°C"
                icon="🌡️"
              />
              <StatCard
                label="Max Temp"
                value={stats.max_temp}
                unit="°C"
                icon="🌡️"
              />
              <StatCard
                label="Avg Humidity"
                value={stats.avg_humidity}
                unit="%"
                icon="💧"
              />
              <StatCard
                label="Avg Gas"
                value={stats.avg_gas}
                unit="ppm"
                icon="💨"
              />
            </View>
          )}

          {/* Gas Chart */}
          {gasData && (
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>💨 Gas Level (ppm)</Text>
              <LineChart
                data={gasData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero
              />
            </View>
          )}

          {/* Temp Chart */}
          {tempData && (
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>🌡️ Temperature (°C)</Text>
              <LineChart
                data={tempData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero
              />
            </View>
          )}

          {/* Humidity Chart */}
          {humidityData && (
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>💧 Humidity (%)</Text>
              <LineChart
                data={humidityData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero
              />
            </View>
          )}

          {/* Recent Readings */}
          <Text style={styles.sectionTitle}>📋 Recent Readings</Text>
          {history.slice(0, 10).map((item, i) => (
            <View key={i} style={styles.readingRow}>
              <Text style={styles.readingTime}>{item.timestamp}</Text>
              <View style={styles.readingValues}>
                <Text style={styles.readingValue}>🌡️ {item.temp}°C</Text>
                <Text
                  style={[styles.readingValue, item.gas > 2000 && styles.alertValue]}
                >
                  💨 {item.gas}
                </Text>
                <Text style={styles.readingValue}>💧 {item.humidity}%</Text>
                <Text
                  style={[styles.readingValue, item.flame === 1 && styles.alertValue]}
                >
                  🔥 {item.flame === 1 ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, unit = '', icon, alert = false }) {
  return (
    <View style={[styles.statCard, alert && styles.statCardAlert]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, alert && styles.statValueAlert]}>
        {value} {unit}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },

  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeBtnActive: { backgroundColor: '#3b82f6' },
  rangeBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  rangeBtnTextActive: { color: '#fff' },

  emptyBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginBottom: 8 },
  emptySubText: { fontSize: 13, color: '#64748b', textAlign: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statCardAlert: { borderColor: '#ef4444', borderWidth: 2 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statValueAlert: { color: '#ef4444' },
  statLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },

  chartBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 8 },
  chart: { borderRadius: 12 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 12,
  },
  readingRow: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  readingTime: { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  readingValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  readingValue: { fontSize: 13, color: '#e2e8f0' },
  alertValue: { color: '#ef4444', fontWeight: 'bold' },
});