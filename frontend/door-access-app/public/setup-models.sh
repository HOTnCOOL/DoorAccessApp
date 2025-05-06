#!/bin/bash

# Face Recognition Models Setup Script
# This script downloads the necessary models for face-api.js

# Create models directory
mkdir -p models
cd models

# List of models to download
MODELS=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
)

# Base URL for models
BASE_URL="https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

echo "Downloading face recognition models..."

# Download each model
for model in "${MODELS[@]}"; do
  if [ ! -f "$model" ]; then
    echo "Downloading $model..."
    curl -O -L "$BASE_URL/$model"
  else
    echo "$model already exists, skipping download."
  fi
done

echo "All models downloaded successfully to $(pwd)."
echo "Face recognition is now ready to use."