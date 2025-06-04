from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import requests

app = Flask(__name__)
CORS(app)

import os
from dotenv import load_dotenv
 
load_dotenv()  
mongo_uri = os.getenv('COSMOS_CONNECTION_STRING')

mongo_client = MongoClient(mongo_uri)

# mongo_client = MongoClient("mongodb://localhost:27017/")
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
    
@app.route('/api/rai/bulk-update-answers', methods=['POST'])
def bulk_update_answers():
    try:
        edits = request.json.get("edits", [])
        for edit in edits:
            question = edit.get("question")
            updated_answer = edit.get("updated_answer")
            edited_by = edit.get("edited_by")
            edited_at = edit.get("edited_at")
            if question and updated_answer is not None:
                edited_collection.update_one(
                    {"question": question},
                    {"$set": {
                        "updated_answer": updated_answer,
                        "edited_by": edited_by,
                        "edited_at": edited_at
                    }},
                    upsert=True
                )
        return jsonify({"message": "Bulk update successful"})
    except Exception as e:
        print('Bulk update error:', e)
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(port=5000, debug=True)
