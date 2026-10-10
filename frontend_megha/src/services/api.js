// src/services/api.js

// ⚠️ REPLACE WITH YOUR LAPTOP'S ACTUAL IP ADDRESS
const API_URL = "https://fire-gas-detection-backend.onrender.com";

// ============================================================
// PREDICTION - Current AI prediction from Flask
// ============================================================
export const getPrediction = async () => {
  try {
    const response = await fetch(`${API_URL}/api/predict`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Backend Data:", data);
    return data;
  } catch (error) {
    console.error("Backend Connection Error:", error);
    throw error;
  }
};

// ============================================================
// HISTORY - Historical sensor readings
// ============================================================
export const getHistory = async (days = 365, limit = 1000) => {
  try {
    const url = `${API_URL}/api/history?days=${days}&limit=${limit}`;
    console.log("Fetching history:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`History loaded: ${data.count} readings`);
    return data;
  } catch (error) {
    console.error("History fetch error:", error);
    throw error;
  }
};

// ============================================================
// STATS - Aggregated statistics
// ============================================================
export const getStats = async (days = 365) => {
  try {
    const url = `${API_URL}/api/stats?days=${days}`;
    console.log("Fetching stats:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Stats loaded:", data);
    return data;
  } catch (error) {
    console.error("Stats fetch error:", error);
    throw error;
  }
};

// ============================================================
// HEALTH CHECK - Verify backend is reachable
// ============================================================
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
};
