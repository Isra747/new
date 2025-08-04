from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load model and encoders
with open("xgboost_disease_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

with open("symptom_encoder.pkl", "rb") as f:
    symptom_encoder = pickle.load(f)

# List of all possible symptoms (must match model input order)
ALL_SYMPTOMS = [
    "Abdominal pain", "Acute blindness", "Aggression", "Anorexia", "Bad breath", "Bleeding of gum", "Blindness",
    "Bloated Stomach", "Blood in urine", "Bloody discharge", "Breathing Difficulty", "Burping", "Cataracts", "Collapse",
    "Coma", "Constipation", "Continuously erect and stiff ears", "Coughing", "Dandruff", "Depression", "Diarrhea",
    "Difficulty Urinating", "Discomfort", "Dry Skin", "Eating grass", "Eating less than usual", "Enlarged Liver",
    "Excessive Salivation", "Eye Discharge", "Face rubbing", "Fever", "Fur loss", "Glucose in urine", "Grinning appearance",
    "Heart Complication", "Hunger", "Increased drinking and urination", "Irritation", "Itchy skin", "Lack of energy",
    "Lameness", "Lethargy", "Licking", "Losing sight", "Loss of Consciousness", "Loss of Fur", "Loss of appetite",
    "Lumps", "Nasal Discharge", "Pain", "Pale gums", "Paralysis", "Passing gases", "Plaque", "Purging", "Receding gum",
    "Red bumps", "Red patches", "Redness around Eye area", "Redness of gum", "Redness of skin", "Scabs", "Scratching",
    "Seizures", "Sepsis", "Severe Dehydration", "Smelly", "Stiff and hard tail", "Stiffness of muscles", "Swelling",
    "Swelling of gum", "Tartar", "Tender abdomen", "Urine infection", "Vomiting", "Weakness", "Weight Loss", "Wounds",
    "Wrinkled forehead", "Yellow gums", "blood in stools", "excess jaw tone"
]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        input_symptoms = data.get("symptoms", [])

        # Create binary symptom vector
        symptom_vector = [1 if symptom in input_symptoms else 0 for symptom in ALL_SYMPTOMS]
        symptom_vector = np.array(symptom_vector).reshape(1, -1)

        # Predict class and probabilities
        prediction = model.predict(symptom_vector)
        probabilities = model.predict_proba(symptom_vector)

        predicted_label = label_encoder.inverse_transform(prediction)[0]
        confidence = float(np.max(probabilities))  # Confidence of the predicted class

        if confidence < 0.75:
            return jsonify({
                "predicted_disease": "Unknown Disease"
            }), 200

        return jsonify({
            "predicted_disease": predicted_label,
            "confidence": round(confidence, 4)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Disease Detection API is running."}), 200


if __name__ == "__main__":
    # Listen on all interfaces so mobile devices can access via LAN
    app.run(debug=True, host="0.0.0.0", port=5005)