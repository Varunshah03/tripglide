from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
import re
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from livereload import Server
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Match frontend port

# Configure logging to file for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='server.log'
)
logger = logging.getLogger(__name__)

# MySQL Connection with reconnection logic
def get_db_connection():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",  # Update with your MySQL password if set
            database="tripglide"
        )
        logger.info("Database connection established")
        return db
    except mysql.connector.Error as e:
        logger.error(f"Failed to connect to database: {e}")
        return None

# Initialize global db connection
db = get_db_connection()

# Check and reconnect database if needed
def ensure_db_connection():
    global db
    if not db or not db.is_connected():
        logger.warning("Database connection lost, attempting to reconnect")
        db = get_db_connection()
    return db

# Initialize database tables to match provided schema
def initialize_database():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        logger.error("Cannot initialize database: No connection")
        return
    cursor = None
    try:
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INT NOT NULL AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                birthday DATE DEFAULT NULL,
                gender VARCHAR(10) NOT NULL,
                phone VARCHAR(15) DEFAULT NULL,
                address VARCHAR(255) DEFAULT NULL,
                state VARCHAR(50) DEFAULT NULL,
                pincode VARCHAR(6) DEFAULT NULL,
                otp VARCHAR(6) DEFAULT NULL,
                otp_verified TINYINT(1) DEFAULT 0,
                PRIMARY KEY (user_id),
                UNIQUE KEY email (email)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flight_bookings (
                booking_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                from_city VARCHAR(100) NOT NULL,
                to_city VARCHAR(100) NOT NULL,
                departure_date DATETIME NOT NULL,
                cost DECIMAL(10,2) NOT NULL,
                status ENUM('Upcoming','Completed','Cancelled') DEFAULT 'Upcoming',
                PRIMARY KEY (booking_id),
                KEY user_id (user_id),
                CONSTRAINT flight_bookings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotel_bookings (
                booking_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                hotel_name VARCHAR(100) NOT NULL,
                check_in_date DATETIME NOT NULL,
                check_out_date DATETIME NOT NULL,
                cost DECIMAL(10,2) NOT NULL,
                status ENUM('Upcoming','Completed','Cancelled') DEFAULT 'Upcoming',
                PRIMARY KEY (booking_id),
                KEY user_id (user_id),
                CONSTRAINT hotel_bookings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS car_rentals (
                rental_id INT NOT NULL AUTO_INCREMENT,
                user_id INT NOT NULL,
                car_name VARCHAR(100) NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NOT NULL,
                cost DECIMAL(10,2) NOT NULL,
                status ENUM('Upcoming','Completed','Cancelled') DEFAULT 'Upcoming',
                PRIMARY KEY (rental_id),
                KEY user_id (user_id),
                CONSTRAINT car_rentals_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        db.commit()
        logger.info("Database tables initialized")
    except mysql.connector.Error as e:
        logger.error(f"Failed to initialize database tables: {e}")
        if db:
            db.rollback()
    finally:
        if cursor:
            cursor.close()

if db:
    initialize_database()

# Serve favicon
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

# Root route
@app.route('/')
def index():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database connection failed"}), 500
    return jsonify({"success": True, "message": "TripGlide API running"}), 200

# Load Twilio credentials
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_VERIFY_SERVICE_SID = os.getenv('TWILIO_VERIFY_SERVICE_SID')

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}")
else:
    logger.error("Twilio credentials missing")

# Validation Functions
def is_email(input_str):
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', input_str))

def is_phone(input_str):
    return bool(re.match(r'^\d{10}$', input_str))

def validate_password(password):
    return len(password) >= 6

# Twilio Functions
def send_verification(identifier, channel='sms'):
    if not twilio_client:
        logger.error("Twilio client not initialized")
        raise Exception("Twilio client not initialized")
    try:
        verification = twilio_client.verify.services(TWILIO_VERIFY_SERVICE_SID) \
            .verifications \
            .create(to=identifier if channel == 'email' else f"+91{identifier}", channel=channel)
        logger.info(f"Verification sent to {identifier} via {channel}: {verification.sid}")
        return verification.sid
    except TwilioRestException as e:
        logger.error(f"Twilio error sending OTP to {identifier}: {e}")
        raise

def verify_code(identifier, code, channel='sms'):
    if not twilio_client:
        logger.error("Twilio client not initialized for verification")
        raise Exception("Twilio client not initialized")
    try:
        verification_check = twilio_client.verify.services(TWILIO_VERIFY_SERVICE_SID) \
            .verification_checks \
            .create(to=identifier if channel == 'email' else f"+91{identifier}", code=code)
        logger.info(f"Verification check for {identifier}: {verification_check.status}")
        return verification_check.status == 'approved'
    except TwilioRestException as e:
        logger.error(f"Twilio verification error for {identifier}: {e}")
        return False

# Reset Route
@app.route("/api/reset", methods=["POST"])
def reset():
    logger.info("Server state reset")
    return jsonify({"success": True, "message": "Server state reset"}), 200

# Signup Route
@app.route("/api/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return jsonify({"success": False, "error": "Method not allowed, use POST"}), 405
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not all([identifier, password, confirm_password]):
            return jsonify({"success": False, "error": "All fields required"}), 400
        if password != confirm_password:
            return jsonify({"success": False, "error": "Passwords don’t match"}), 400
        if not validate_password(password):
            return jsonify({"success": False, "error": "Password too short (min 6 chars)"}), 400
        if not (is_email(identifier) or is_phone(identifier)):
            return jsonify({"success": False, "error": "Invalid email/phone"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT user_id FROM users WHERE {field} = %s", (identifier,))
        if cursor.fetchall():
            return jsonify({"success": False, "error": "User already exists"}), 409

        cursor.execute(
            f"INSERT INTO users ({field}, password, username, gender, otp_verified) VALUES (%s, %s, %s, %s, %s)",
            (identifier, password, "NewUser", "Unknown", 0)
        )
        db.commit()
        logger.info(f"User signed up: {field}={identifier}")
        return jsonify({"success": True, "message": "Signup successful"}), 201
    except mysql.connector.Error as e:
        logger.error(f"Database error in signup: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Signup error: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Login Route
@app.route("/api/login", methods=["POST"])
def login():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        identifier = data.get("identifier")
        password = data.get("password")
        logger.debug(f"Login attempt: identifier={identifier}")

        if not identifier or not password:
            return jsonify({"success": False, "error": "Identifier and password required"}), 400
        if not (is_email(identifier) or is_phone(identifier)):
            return jsonify({"success": False, "error": "Invalid email/phone"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        query = f"SELECT * FROM users WHERE {field} = %s AND password = %s"
        cursor.execute(query, (identifier, password))
        user = cursor.fetchone()
        cursor.fetchall()
        logger.debug(f"Query: {query}, Result: {user}")

        if not user:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        identifiers_to_verify = []
        try:
            channel = 'email' if is_email(identifier) else 'sms'
            send_verification(identifier, channel=channel)
            identifiers_to_verify.append({"identifier": identifier, "type": channel})

            if field == "phone" and user["email"]:
                try:
                    send_verification(user["email"], channel='email')
                    identifiers_to_verify.append({"identifier": user["email"], "type": "email"})
                except Exception as e:
                    logger.warning(f"Failed to send email OTP to {user['email']}: {e}")
            elif field == "email" and user["phone"]:
                try:
                    send_verification(user["phone"], channel='sms')
                    identifiers_to_verify.append({"identifier": user["phone"], "type": "phone"})
                except Exception as e:
                    logger.warning(f"Failed to send SMS OTP to {user['phone']}: {e}")

            user_data = {k: v for k, v in user.items() if k != "password"}
            logger.info(f"Login pending OTP: {field}={identifier}, sent to {identifiers_to_verify}")
            return jsonify({
                "success": False,
                "requires_verification": True,
                "identifiers": identifiers_to_verify,
                "user": user_data
            }), 200
        except TwilioRestException as e:
            logger.error(f"Twilio error sending OTP: {e}")
            return jsonify({"success": False, "error": "Failed to send OTP, please try again later"}), 503
        except Exception as e:
            logger.error(f"Unexpected error sending OTP: {e}")
            return jsonify({"success": False, "error": "Failed to send OTP, please try again later"}), 503
    except mysql.connector.Error as e:
        logger.error(f"Database error in login: {e}")
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Verify Code Route
@app.route("/api/verify_code", methods=["POST"])
def verify_code_route():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        code = data.get("code")

        if not identifier or not code:
            return jsonify({"success": False, "error": "Identifier and code required"}), 400
        if not (is_email(identifier) or is_phone(identifier)):
            return jsonify({"success": False, "error": "Invalid email/phone"}), 400

        channel = 'email' if is_email(identifier) else 'sms'
        if verify_code(identifier, code, channel):
            cursor = db.cursor(dictionary=True)
            field = "email" if is_email(identifier) else "phone"
            cursor.execute(f"UPDATE users SET otp_verified = 1 WHERE {field} = %s", (identifier,))
            db.commit()
            cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (identifier,))
            user = cursor.fetchone()
            cursor.fetchall()
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            logger.info(f"{field} verified for {identifier}")
            return jsonify({
                "success": True,
                "message": "Verification successful",
                "user": {k: v for k, v in user.items() if k != "password"}
            }), 200
        return jsonify({"success": False, "error": "Invalid code"}), 400
    except mysql.connector.Error as e:
        logger.error(f"Database error in verify_code: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Verify code error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Forgot Password Routes
@app.route("/api/forgot_password", methods=["POST"])
def forgot_password():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        if not identifier:
            return jsonify({"success": False, "error": "Identifier required"}), 400
        if not (is_email(identifier) or is_phone(identifier)):
            return jsonify({"success": False, "error": "Invalid email/phone"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT email, phone, password FROM users WHERE {field} = %s", (identifier,))
        user = cursor.fetchone()
        cursor.fetchall()
        if not user:
            return jsonify({"success": False, "error": "No account found with this identifier"}), 404

        return jsonify({
            "success": True,
            "email": user["email"] or "",
            "phone": user["phone"] or "",
            "requires_password": True
        }), 200
    except mysql.connector.Error as e:
        logger.error(f"Database error in forgot_password: {e}")
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

@app.route("/api/reset_password_request", methods=["POST"])
def reset_password_request():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not all([identifier, current_password, new_password]):
            return jsonify({"success": False, "error": "All fields required"}), 400
        if not validate_password(new_password):
            return jsonify({"success": False, "error": "New password too short (min 6 chars)"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT * FROM users WHERE {field} = %s AND password = %s", (identifier, current_password))
        user = cursor.fetchone()
        cursor.fetchall()
        if not user:
            return jsonify({"success": False, "error": "Invalid current password"}), 401

        channel = 'email' if is_email(identifier) else 'sms'
        send_verification(identifier, channel)
        logger.info(f"Password reset OTP sent to {identifier}")
        return jsonify({
            "success": True,
            "message": "OTP sent for password reset",
            "identifier": identifier,
            "new_password": new_password
        }), 200
    except TwilioRestException as e:
        logger.error(f"Twilio error sending reset OTP: {e}")
        return jsonify({"success": False, "error": f"Failed to send OTP: {str(e)}"}), 503
    except mysql.connector.Error as e:
        logger.error(f"Database error in reset_password_request: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Reset password request error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

@app.route("/api/reset_password_verify", methods=["POST"])
def reset_password_verify():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        code = data.get("code")
        new_password = data.get("new_password")

        if not all([identifier, code, new_password]):
            return jsonify({"success": False, "error": "All fields required"}), 400

        channel = 'email' if is_email(identifier) else 'sms'
        if verify_code(identifier, code, channel):
            cursor = db.cursor(dictionary=True)
            field = "email" if is_email(identifier) else "phone"
            cursor.execute(f"UPDATE users SET password = %s WHERE {field} = %s", (new_password, identifier))
            db.commit()
            cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (identifier,))
            user = cursor.fetchone()
            cursor.fetchall()
            logger.info(f"Password reset successful for {identifier}")
            return jsonify({
                "success": True,
                "message": "Password reset successful",
                "user": {k: v for k, v in user.items() if k != "password"}
            }), 200
        return jsonify({"success": False, "error": "Invalid OTP"}), 400
    except mysql.connector.Error as e:
        logger.error(f"Database error in reset_password_verify: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Reset password verify error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Profile Route
@app.route("/api/profile", methods=["GET"])
def profile():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        identifier = request.args.get("identifier")
        if not identifier:
            return jsonify({"success": False, "error": "Identifier required"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (identifier,))
        user = cursor.fetchone()
        cursor.fetchall()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        user_data = {k: v for k, v in user.items() if k != "password"}
        logger.info(f"Profile fetched for {field}={identifier}")
        return jsonify({"success": True, "user": user_data}), 200
    except mysql.connector.Error as e:
        logger.error(f"Database error in profile: {e}")
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Profile error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Update Profile Route
@app.route("/api/update_profile", methods=["POST"])
def update_profile():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        if not identifier:
            return jsonify({"success": False, "error": "Identifier required"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT user_id FROM users WHERE {field} = %s", (identifier,))
        user = cursor.fetchone()
        cursor.fetchall()
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        update_fields = {k: v for k, v in data.items() if k in ["username", "birthday", "gender", "address", "pincode", "state", "email", "phone"] and v is not None}
        if not update_fields:
            return jsonify({"success": False, "error": "No valid fields to update"}), 400

        if "birthday" in update_fields and update_fields["birthday"]:
            try:
                datetime.strptime(update_fields["birthday"], "%Y-%m-%d")
            except ValueError:
                return jsonify({"success": False, "error": "Birthday must be in YYYY-MM-DD format"}), 400

        set_clause = ", ".join([f"{k} = %s" for k in update_fields.keys()])
        values = list(update_fields.values()) + [identifier]
        query = f"UPDATE users SET {set_clause} WHERE {field} = %s"
        logger.debug(f"Update query: {query}, Values: {values}")
        cursor.execute(query, values)
        db.commit()
        logger.info(f"Profile updated for {field}={identifier}")
        return jsonify({"success": True, "message": "Profile updated"}), 200
    except mysql.connector.Error as e:
        logger.error(f"Database error in update_profile: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Change Password Route
@app.route("/api/change_password", methods=["POST"])
def change_password():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    cursor = None
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")

        if not all([identifier, current_password, new_password]):
            return jsonify({"success": False, "error": "All fields required"}), 400
        if not validate_password(new_password):
            return jsonify({"success": False, "error": "New password too short (min 6 chars)"}), 400

        cursor = db.cursor(dictionary=True)
        field = "email" if is_email(identifier) else "phone"
        cursor.execute(f"SELECT user_id FROM users WHERE {field} = %s AND password = %s", (identifier, current_password))
        user = cursor.fetchone()
        cursor.fetchall()
        if not user:
            return jsonify({"success": False, "error": "Invalid current password"}), 401

        cursor.execute(f"UPDATE users SET password = %s WHERE {field} = %s", (new_password, identifier))
        db.commit()
        logger.info(f"Password changed for {field}={identifier}")
        return jsonify({"success": True, "message": "Password changed"}), 200
    except mysql.connector.Error as e:
        logger.error(f"Database error in change_password: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Change password error: {e}")
        if db:
            db.rollback()
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()

# Request Verification Route
@app.route("/api/request_verification", methods=["POST"])
def request_verification():
    db = ensure_db_connection()
    if not db or not db.is_connected():
        return jsonify({"success": False, "error": "Database unavailable"}), 500
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        if not identifier:
            return jsonify({"success": False, "error": "Identifier required"}), 400
        if not (is_email(identifier) or is_phone(identifier)):
            return jsonify({"success": False, "error": "Invalid email/phone"}), 400

        channel = 'email' if is_email(identifier) else 'sms'
        send_verification(identifier, channel)
        logger.info(f"Verification requested for {identifier} via {channel}")
        return jsonify({"success": True, "message": f"Verification sent to {identifier}"}), 200
    except TwilioRestException as e:
        logger.error(f"Twilio error in request_verification: {e}")
        return jsonify({"success": False, "error": f"Verification service error: {str(e)}"}), 503
    except Exception as e:
        logger.error(f"Request verification error: {e}")
        return jsonify({"success": False, "error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    server = Server(app.wsgi_app)
    server.watch('*.py')
    server.serve(host='0.0.0.0', port=5001, debug=True)