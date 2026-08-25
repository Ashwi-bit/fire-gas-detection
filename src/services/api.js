const API_URL = "http://192.168.137.237"

export const getPrediction = async () => {
  try {
    const response = await fetch(`${API_URL}/api/predict`);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Prediction API Error:", error);
    throw error;
  }
};