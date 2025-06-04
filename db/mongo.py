from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["rai_db"]
collection = db["edited_answers"]

print("📦 Documents in edited_answers collection:")
for doc in collection.find():
    print(doc)
    