import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import time
from collections import deque, defaultdict

# -----------------------------
# Load Model
# -----------------------------

MODEL_PATH = "emotion_model.keras"      # Change to emotion_model.h5 if needed

print("Loading model...")

model = load_model(MODEL_PATH)

print("Model Loaded Successfully!")

# -----------------------------
# Emotion Labels
# -----------------------------

# Labels: FER-2013 standard ordering
emotion_labels = {
    0: "Angry",
    1: "Disgust",
    2: "Fear",
    3: "Happy",
    4: "Sad",
    5: "Surprise",
    6: "Neutral"
}

# Debug and smoothing options
DEBUG = False
SMOOTHING = True            # enable temporal smoothing of predictions per face
SMOOTH_WINDOW = 8          # number of recent predictions to average
prediction_buffers = defaultdict(lambda: deque(maxlen=SMOOTH_WINDOW))

# -----------------------------
# Face Detector
# -----------------------------

face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

# -----------------------------
# Open Webcam
# -----------------------------

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Cannot open webcam")
    exit()

prev_time = time.time()

print("Press Q to Quit")

# -----------------------------
# Main Loop
# -----------------------------

while True:

    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5,
        minSize=(40,40)
    )

    current_time = time.time()

    fps = 1 / (current_time - prev_time)

    prev_time = current_time

    for (x, y, w, h) in faces:

        roi = gray[y:y+h, x:x+w]

        # Do not apply histogram equalization here — training used only rescale
        roi = cv2.resize(roi, (48,48))

        roi = roi.astype("float32") / 255.0

        roi = np.expand_dims(roi, axis=-1)

        roi = np.expand_dims(roi, axis=0)

        prediction = model.predict(roi, verbose=0)[0]

        # Per-face smoothing: use a coarse center-position key so buffers track faces
        if SMOOTHING:
            center_x = x + w//2
            center_y = y + h//2
            key = (center_x // 10, center_y // 10)
            prediction_buffers[key].append(prediction)
            smoothed = np.mean(np.array(prediction_buffers[key]), axis=0)
        else:
            smoothed = prediction

        if DEBUG:
            print("Raw:", np.round(prediction,3), "Smoothed:", np.round(smoothed,3))

        emotion_index = int(np.argmax(smoothed))
        confidence = float(np.max(smoothed) * 100)
        if confidence < 60:
            emotion = "Detecting..."
        else:
            emotion = emotion_labels[emotion_index]

        cv2.rectangle(
            frame,
            (x,y),
            (x+w,y+h),
            (0,255,0),
            2
        )

        text = f"{emotion} : {confidence:.2f}%"

        cv2.putText(
            frame,
            text,
            (x,y-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0,255,255),
            2
        )

    cv2.putText(
        frame,
        f"FPS : {fps:.2f}",
        (20,40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255,0,0),
        2
    )

    cv2.imshow(
        "Real-Time Emotion Detection",
        frame
    )

    key = cv2.waitKey(1)

    if key == ord("q"):
        break

# -----------------------------
# Release Resources
# -----------------------------

cap.release()

cv2.destroyAllWindows()