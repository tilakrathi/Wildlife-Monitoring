from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import base64
import io
import os

app = Flask(__name__)
CORS(app)

# ── Your 13 trained classes (exact order from model) ─────────────────────────
WILDLIFE_CLASSES = [
    "bear", "bison", "deer", "elephant", "fox",
    "giraffe", "hyena", "leopard", "person", "tiger",
    "wild_boar", "wolf", "zebra"
]

# ── Load your real trained model ──────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", "best.pt")
model = YOLO(MODEL_PATH)
print(f"✅ Model loaded from: {MODEL_PATH}")
print(f"✅ Classes: {model.names}")
# ─────────────────────────────────────────────────────────────────────────────


def real_predict(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model.predict(source=img, conf=0.5)
    detections = []
    for r in results:
        for box in r.boxes:
            class_name = model.names[int(box.cls)]
            detections.append({
                "class": class_name.lower(),
                "confidence": round(float(box.conf), 3),
                "bbox": [round(float(v), 3) for v in box.xywhn[0].tolist()]
            })
    return detections


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_PATH,
        "classes": WILDLIFE_CLASSES
    })


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not file.content_type.startswith("image/"):
        return jsonify({"error": f"Unsupported file type: {file.content_type}"}), 415

    image_bytes = file.read()
    detections = real_predict(image_bytes)
    annotated_b64 = base64.b64encode(image_bytes).decode("utf-8")

    return jsonify({
        "detections": detections,
        "count": len(detections),
        "annotated_image": annotated_b64,
        "mime": file.content_type,
    })


@app.route("/metrics", methods=["GET"])
def metrics():
    return jsonify({
        "map50": 0.914,
        "precision": 0.916,
        "recall": 0.839,
        "classes": WILDLIFE_CLASSES,
        "epochs": 20,
        "image_size": 416,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
