import datetime
import qrcode
import uuid
import json
import os
import mysql.connector
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from datetime import date
import random
import string

app = Flask(__name__)
CORS(app)

# IMPORTANT: USE THE SAME IP AS FRONTEND
YOUR_LOCAL_IP_ADDRESS = '10.94.109.213'

DATABASE_USER = 'root'  # Replace with your MySQL username
DATABASE_PASSWORD = 'miru@3435'  # Replace with your MySQL password
DATABASE_NAME = 'tourist_id_db'


# --- Utility Functions ---

def generate_tourist_id():
    """Generates a unique tourist ID using a UUID."""
    return str(uuid.uuid4())

def generate_qr_code(tourist_id):
    """Generates a QR code image as a base64 string with verify URL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    # Store verify URL inside QR
    verify_url = f"http://{YOUR_LOCAL_IP_ADDRESS}:5000/verify/{tourist_id}"
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    import io
    from base64 import b64encode
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_b64 = b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{img_b64}"


def get_db_connection():
    """Establishes and returns a connection to the MySQL database."""
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="miru@3435",
            database="tourist_id_db"
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None


def update_blockchain_ledger(tourist_id, status):
    """Updates the blockchain ledger file with a new transaction inside blockchain_data folder."""
    folder = 'blockchain_data'
    os.makedirs(folder, exist_ok=True)
    ledger_file = os.path.join(folder, 'blockchain_ledger.json')

    transactions = []
    if os.path.exists(ledger_file):
        with open(ledger_file, 'r') as f:
            transactions = json.load(f)

    # Generate a dummy blockchain transaction ID
    blockchain_id = ''.join(random.choices(string.hexdigits, k=64))

    new_transaction = {
        "tourist_id": tourist_id,
        "blockchainTransactionId": f"0x{blockchain_id}",
        "status": status,
        "created_at": datetime.datetime.now().isoformat()
    }

    transactions.append(new_transaction)

    with open(ledger_file, 'w') as f:
        json.dump(transactions, f, indent=2)


# --- API Endpoints ---

@app.route('/register_tourist', methods=['POST'])
def register_tourist():
    """Handles tourist registration, saves data to the database, and returns a QR code."""
    data = request.json
    tourist_id = generate_tourist_id()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed."}), 500

    cursor = conn.cursor()
    sql = """
        INSERT INTO tourists 
        (id, name, age, dob, kyc_type, kyc_number, start_date, valid_until, trip_itinerary, emergency_contact) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    try:
        cursor.execute(sql, (
            tourist_id,
            data['name'],
            data['age'],
            data['dob'],
            data['kyc_type'],
            data['kyc_number'],
            data['start_date'],
            data['end_date'],
            data['trip_itinerary'],
            data['emergency_contact']
        ))
        conn.commit()

        # Update blockchain ledger
        update_blockchain_ledger(tourist_id, 'active')

        # Generate QR code with verify URL
        qr_code_data = generate_qr_code(tourist_id)

        return jsonify({
            "tourist_id": tourist_id,
            "qr_code_data": qr_code_data,
            "message": "Tourist registered successfully."
        })

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/end_trip', methods=['POST'])
def end_trip():
    """Handles ending a tourist's trip by updating the database."""
    data = request.json
    tourist_id = data.get('tourist_id')
    if not tourist_id:
        return jsonify({"error": "Tourist ID is required."}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed."}), 500

    cursor = conn.cursor()
    sql = "DELETE FROM tourists WHERE id = %s"
    try:
        cursor.execute(sql, (tourist_id,))
        conn.commit()

        # Update blockchain ledger
        update_blockchain_ledger(tourist_id, 'ended')

        if cursor.rowcount > 0:
            return jsonify({"message": f"Trip for tourist ID {tourist_id} has been ended."})
        else:
            return jsonify({"error": "Tourist ID not found."}), 404

    except mysql.connector.Error as err:
        conn.rollback()
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/verify/<tourist_id>', methods=['GET'])
def verify_tourist(tourist_id):
    """Verifies a tourist ID and returns a beautiful ID card."""
    conn = get_db_connection()
    if conn is None:
        return "<h1>Database connection failed.</h1>", 500

    cursor = conn.cursor(dictionary=True)
    sql = "SELECT id, name, kyc_type, kyc_number, valid_until FROM tourists WHERE id = %s"
    try:
        cursor.execute(sql, (tourist_id,))
        record = cursor.fetchone()
        if record:
            status = "Active"

            # Beautified ID Card HTML
            html_content = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tourist ID</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body {{ background-color: #1f2937; font-family: Arial, sans-serif; }}
                    .card {{
                        max-width: 400px;
                        margin: 50px auto;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        padding: 20px;
                        border-radius: 20px;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                        color: white;
                    }}
                    .field-label {{ color: #facc15; font-weight: bold; font-size: 0.85rem; }}
                    .field-value {{ font-size: 1rem; margin-bottom: 8px; }}
                    .status-badge {{
                        display: block;
                        text-align: center;
                        padding: 6px 0;
                        border-radius: 10px;
                        font-weight: bold;
                        background-color: #16a34a;
                        margin-top: 15px;
                    }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="text-align:center; font-size:22px; margin-bottom:15px; font-weight:bold;">Digital Tourist ID</h2>
                    <p class="field-label">Full Name</p>
                    <p class="field-value">{record['name']}</p>

                    <p class="field-label">Tourist ID</p>
                    <p class="field-value break-all">{record['id']}</p>

                    <p class="field-label">KYC</p>
                    <p class="field-value">{record['kyc_type'].upper()}: {record['kyc_number']}</p>

                    <p class="field-label">Valid Until</p>
                    <p class="field-value">{record['valid_until']}</p>

                    <span class="status-badge">{status}</span>
                </div>
            </body>
            </html>
            """
            return render_template_string(html_content), 200
        else:
            ledger_file = os.path.join('blockchain_data', 'blockchain_ledger.json')
            if os.path.exists(ledger_file):
                with open(ledger_file, 'r') as f:
                    transactions = json.load(f)

                for transaction in transactions:
                    if transaction.get('tourist_id') == tourist_id:
                        status = "Trip Ended" if transaction.get('status') == 'ended' else "Unknown"
                        html_content = f"""
                        <div class="p-4 bg-gray-800 rounded-lg shadow-md max-w-sm mx-auto mt-10">
                            <p class="text-white font-semibold text-lg text-center">Tourist ID Verified</p>
                            <p class="text-white font-semibold text-sm break-all text-center">{tourist_id}</p>
                            <span class="status-badge mt-4 text-center font-bold p-1 rounded-full text-xs bg-red-600 text-white">{status}</span>
                        </div>
                        """
                        return render_template_string(html_content), 200

            return jsonify({"error": "Tourist ID not found or invalid."}), 404

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    app.run(host=YOUR_LOCAL_IP_ADDRESS, port=5000, debug=True)
