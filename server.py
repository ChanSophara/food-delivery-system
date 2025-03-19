from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json  # For parsing JSON strings
import pprint  # For pretty-printing data (optional)

app = Flask(__name__)
CORS(app)  # Allow frontend requests

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect("local_storage.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS storage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT,
            value TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()  # Run database setup

# API to save data
@app.route("/saveData", methods=["POST"])
def save_data():
    try:
        data = request.json
        key = data["key"]
        value = str(data["value"])  # Convert JSON to string before saving

        # Validate the JSON data before saving
        if not validate_json(value):
            return jsonify({"error": "Invalid JSON data"}), 400

        conn = sqlite3.connect("local_storage.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO storage (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        conn.close()

        print("Data saved to SQLite successfully.")
        return jsonify({"message": "Data saved to SQLite"}), 200
    except Exception as e:
        print(f"Error saving data: {e}")
        return jsonify({"error": str(e)}), 500

# API to fetch data
@app.route("/getData", methods=["GET"])
def get_data():
    try:
        conn = sqlite3.connect("local_storage.db")
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM storage")
        rows = cursor.fetchall()
        conn.close()

        # Parse the JSON strings in the 'value' field
        parsed_rows = []
        for row in rows:
            id, key, value = row
            try:
                parsed_value = json.loads(value)  # Parse the JSON string
                parsed_rows.append({"id": id, "key": key, "value": parsed_value})
            except json.JSONDecodeError:
                print(f"Invalid JSON data in row {id}. Skipping.")
                continue

        # Pretty-print the parsed data for debugging (optional)
        pprint.pprint(parsed_rows)

        return jsonify({"data": parsed_rows}), 200
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({"error": str(e)}), 500

# Helper function to validate JSON data
def validate_json(data):
    try:
        json.loads(data)
        return True
    except json.JSONDecodeError:
        return False

if __name__ == "__main__":
    app.run(debug=True, port=5000)