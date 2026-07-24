import base64
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import cv2
import numpy as np
from tensorflow.keras.models import load_model


ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "frontend"
HOST = "127.0.0.1"
PORT = 8000
IMAGE_SIZE = (48, 48)
CONFIDENCE_THRESHOLD = 0.6

EMOTION_LABELS = {
    0: "Angry",
    1: "Disgust",
    2: "Fear",
    3: "Happy",
    4: "Sad",
    5: "Surprise",
    6: "Neutral",
}


def load_detector():
    model_path = ROOT / "emotion_model.keras"
    if not model_path.exists():
        model_path = ROOT / "emotion_model.h5"

    model = load_model(model_path)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_detector = cv2.CascadeClassifier(cascade_path)

    if face_detector.empty():
        raise RuntimeError("Could not load OpenCV Haar cascade face detector.")

    return model, face_detector, model_path.name


MODEL, FACE_DETECTOR, MODEL_NAME = load_detector()


def decode_image(data_url):
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]

    image_bytes = base64.b64decode(data_url)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        raise ValueError("Could not decode image payload.")

    return frame


def predict_emotions(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = FACE_DETECTOR.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5,
        minSize=(40, 40),
    )

    detections = []

    for (x, y, width, height) in faces:
        roi = gray[y : y + height, x : x + width]
        roi = cv2.resize(roi, IMAGE_SIZE)
        roi = roi.astype("float32") / 255.0
        roi = np.expand_dims(roi, axis=-1)
        roi = np.expand_dims(roi, axis=0)

        prediction = MODEL.predict(roi, verbose=0)[0]
        emotion_index = int(np.argmax(prediction))
        confidence = float(prediction[emotion_index])
        label = EMOTION_LABELS[emotion_index]

        detections.append(
            {
                "box": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(width),
                    "height": int(height),
                },
                "emotion": label if confidence >= CONFIDENCE_THRESHOLD else "Detecting",
                "topEmotion": label,
                "confidence": round(confidence * 100, 2),
                "probabilities": {
                    EMOTION_LABELS[index]: round(float(score) * 100, 2)
                    for index, score in enumerate(prediction)
                },
            }
        )

    return detections


class EmotionRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path).path

        if parsed_path == "/":
            self.serve_file(FRONTEND_DIR / "index.html")
            return

        if parsed_path == "/health":
            self.send_json({"status": "ok", "model": MODEL_NAME})
            return

        requested = (FRONTEND_DIR / parsed_path.lstrip("/")).resolve()
        if FRONTEND_DIR in requested.parents and requested.exists():
            self.serve_file(requested)
            return

        self.send_error(404, "Not found")

    def do_POST(self):
        if urlparse(self.path).path != "/predict":
            self.send_error(404, "Not found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = self.rfile.read(content_length)
            body = json.loads(payload)
            frame = decode_image(body.get("image", ""))
            detections = predict_emotions(frame)

            self.send_json(
                {
                    "detections": detections,
                    "image": {
                        "width": int(frame.shape[1]),
                        "height": int(frame.shape[0]),
                    },
                }
            )
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=400)

    def serve_file(self, path):
        content_type = mimetypes.guess_type(path)[0] or "application/octet-stream"
        content = path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, payload, status=200):
        content = json.dumps(payload).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), EmotionRequestHandler)
    print(f"Loaded {MODEL_NAME}")
    print(f"Frontend running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop")
    server.serve_forever()
