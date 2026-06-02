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

## Sample Output Images

<img width="1901" height="911" alt="Screenshot 2026-04-20 101825" src="https://github.com/user-attachments/assets/4a491117-f2ba-4250-8e4f-0567c8a19691" />
<img width="1898" height="910" alt="Screenshot 2026-04-20 101909" src="https://github.com/user-attachments/assets/36543f22-9a93-4710-9282-9686aadb95a1" />
<img width="1890" height="913" alt="Screenshot 2026-04-20 102120" src="https://github.com/user-attachments/assets/eee7ef38-4bae-4d27-8cbd-8454aa927f73" />
<img width="1894" height="912" alt="Screenshot 2026-04-20 102152" src="https://github.com/user-attachments/assets/1810a471-ef46-43b2-845b-d121ac5e6e16" />
<img width="1890" height="907" alt="Screenshot 2026-04-20 102218" src="https://github.com/user-attachments/assets/a2892716-66ee-4e71-9525-510916a82398" />



## API endpoints

- `GET /health` checks that the model is loaded.
- `GET /metrics` returns the model summary shown in the dashboard.
- `POST /predict` accepts an image upload and returns detections.

## Notes

- The frontend talks to the backend at `http://localhost:5000`.
- If you want to use a different model file, set `MODEL_PATH` before starting the backend.
- The model file is kept in the repo because the backend depends on it to run.
