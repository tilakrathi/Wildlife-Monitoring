# Wildlife Monitoring Dashboard

This project is a small wildlife-detection dashboard built with a Flask backend and a React frontend. You can upload a field photo, run it through the trained YOLO model, and see the detected animals highlighted in the browser.

## What’s included

- `Backend/app.py` serves the prediction API and loads the trained model.
- `Backend/best.pt` is the trained YOLO weight file used by the backend.
- `Frontend/` contains the Vite + React dashboard UI.

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- `pip` and `npm`

## Run it locally

Start the backend first:

```bash
cd Backend
pip install -r requirements.txt
python app.py
```

Then start the frontend in a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, then upload an image and run a prediction.

## API endpoints

- `GET /health` checks that the model is loaded.
- `GET /metrics` returns the model summary shown in the dashboard.
- `POST /predict` accepts an image upload and returns detections.

## Notes

- The frontend talks to the backend at `http://localhost:5000`.
- If you want to use a different model file, set `MODEL_PATH` before starting the backend.
- The model file is kept in the repo because the backend depends on it to run.