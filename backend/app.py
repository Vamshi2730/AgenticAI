from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import requests

app = Flask(__name__)
CORS(app)
 
mongo_client = MongoClient(COSMOS_CONNECTION_STRING)
db = mongo_client['rai_db']
edited_collection = db['edited_answers']
original_collection = db['original_answers']

@app.route('/api/rai', methods=['GET'])
def proxy():
    batch_id = request.args.get('batch_id', default="68369f1e49f561a1b4ff57f8")
    url = f"https://rai-toolkit-dev.az.ad.idemo-ppc.com/v1/agent/get_rai_questionnaire?batch_id={batch_id}"

    try:
        response = requests.get(url, verify=False)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rai/original-answer', methods=['POST'])
def save_originals():
    try:
        items = request.json.get("items", [])
        for item in items:
            question = item.get("question")
            answer = item.get("answer")
            if question and answer is not None:
                original_collection.update_one(
                    {"question": question},
                    {"$setOnInsert": {"original_answer": answer}},
                    upsert=True
                )
        return jsonify({"message": "Originals saved"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/rai/update-answer', methods=['POST'])
def save_updated_answer():
    try:
        data = request.json
        print("Received data:", data)
        question = data.get("question")
        updated_answer = data.get("updated_answer")
        edited_by = data.get("edited_by")
        edited_at = data.get("edited_at")

        if not question or updated_answer is None:
            return jsonify({"error": "Missing fields"}), 400

        # Save edited answer only
        edited_collection.update_one(
            {"question": question},
            {"$set": {"updated_answer": updated_answer,"edited_by": edited_by,
                "edited_at": edited_at}},
            upsert=True
        )

        return jsonify({"message": "Edited answer saved"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
