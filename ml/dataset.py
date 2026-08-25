import pandas as pd
import random
from pathlib import Path

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset folder
DATASET_DIR = BASE_DIR / "dataset"
DATASET_DIR.mkdir(exist_ok=True)

data = []

# -----------------------------
# NORMAL
# -----------------------------
for _ in range(500):
    temperature = random.uniform(20, 40)
    flame = 0
    gas = random.uniform(50, 300)

    data.append([
        temperature,
        flame,
        gas,
        "Normal"
    ])


# -----------------------------
# FIRE
# -----------------------------
for _ in range(500):
    temperature = random.uniform(60, 100)
    flame = 1
    gas = random.uniform(50, 400)

    data.append([
        temperature,
        flame,
        gas,
        "Fire"
    ])


# -----------------------------
# GAS LEAKAGE
# -----------------------------
for _ in range(500):
    temperature = random.uniform(20, 50)
    flame = 0
    gas = random.uniform(600, 1000)

    data.append([
        temperature,
        flame,
        gas,
        "Gas Leakage"
    ])


# -----------------------------
# FIRE + GAS LEAKAGE
# -----------------------------
for _ in range(500):
    temperature = random.uniform(60, 100)
    flame = 1
    gas = random.uniform(600, 1000)

    data.append([
        temperature,
        flame,
        gas,
        "Fire + Gas Leakage"
    ])


# Create DataFrame
df = pd.DataFrame(
    data,
    columns=[
        "temperature",
        "flame",
        "gas",
        "label"
    ]
)

# Shuffle data
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Split into train and test
train_size = int(len(df) * 0.8)

train_df = df.iloc[:train_size]
test_df = df.iloc[train_size:]

# Save files
train_df.to_csv(DATASET_DIR / "train.csv", index=False)
test_df.to_csv(DATASET_DIR / "test.csv", index=False)

print("Dataset created successfully!")
print(f"Training samples: {len(train_df)}")
print(f"Testing samples: {len(test_df)}")
print()
print("Training dataset:")
print(train_df.head())