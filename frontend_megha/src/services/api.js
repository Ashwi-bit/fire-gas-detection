// frontend_megha/src/services/api.js

// ⚠️ REPLACE WITH YOUR LAPTOP'S ACTUAL IP ADDRESS
const API_URL = "http://192.168.213.234:5000"; 
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