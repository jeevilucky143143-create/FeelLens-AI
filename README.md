# Emotion Detector 🧠

Real-time facial emotion detection using deep learning and computer vision.

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange?style=flat-square&logo=tensorflow)
![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green?style=flat-square&logo=opencv)

## Overview

A CNN trained on the **FER-2013** dataset (~35,000 labelled facial images) that detects emotions in real time from a webcam feed. OpenCV handles face detection via Haar cascades, and the model classifies each detected face into one of 7 emotional states with a live confidence overlay.

## Emotions Detected

| Emotion | | Emotion | |
|---------|---|---------|---|
| Angry | 😠 | Neutral | 😐 |
| Disgust | 🤢 | Sad | 😢 |
| Fear | 😨 | Surprise | 😲 |
| Happy | 😊 | | |

## How It Works

1. **Face Detection** — OpenCV's Haar cascade locates faces in each webcam frame
2. **Preprocessing** — Detected face region is cropped, resized to 48×48px, and normalized
3. **Inference** — The CNN outputs a probability distribution across 7 emotions
4. **Visualization** — Bounding box, emotion label, confidence %, and live per-emotion confidence bars are overlaid on the frame in real time

## Tech Stack

- **Python** · **TensorFlow / Keras** · **OpenCV** · **NumPy**

## Getting Started

### Install dependencies

```bash
pip install tensorflow opencv-python numpy
```

### Run the live detector

The pre-trained model (`emotion_model.h5`) is included — no training needed.

```bash
python detect.py
```

> Press **Q** in the camera window to quit.

### Run the browser frontend

The project also includes a local web UI for camera capture and image upload.

```bash
python web_app.py
```

Then open `http://127.0.0.1:8000` in your browser. The page sends frames to the
local Python backend, which runs the same Haar cascade face detection and Keras
emotion model inference.

### Train your own model

1. Download the [FER-2013 dataset](https://www.kaggle.com/datasets/msambare/fer2013) from Kaggle
2. Place it in a `data/` folder
3. Run:

```bash
python train_model.py
```

## Model Performance

~60–65% accuracy on the FER-2013 test set — competitive with many published results on this benchmark. FER-2013 is considered a hard dataset due to noisy labels and high inter-class similarity.

**Tips for best results:** good front-facing lighting, face centered in frame.

## Project Structure

```
emotion-detector/
├── detect.py           # Live webcam detection script
├── web_app.py          # Local browser frontend + prediction API
├── frontend/           # HTML, CSS, and JavaScript UI
├── train_model.py      # CNN training script
├── emotion_model.h5    # Pre-trained model weights
└── README.md
```
