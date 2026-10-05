import os

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash


# =========================================
# FLASK APP
# =========================================

app = Flask(__name__)

# Local development secret.
# For deployment, set SECRET_KEY as an environment variable.
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "cyber-awareness-development-secret-change-before-deployment"
)

# Session cookie security
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False


# =========================================
# CORS
# =========================================

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
)


# =========================================
# DATABASE CONNECTION
# =========================================

def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get("DB_HOST", "localhost"),
        database=os.environ.get(
            "DB_NAME",
            "cyber_awareness"
        ),
        user=os.environ.get(
            "DB_USER",
            "postgres"
        ),
        password=os.environ.get(
            "DB_PASSWORD"
        ),
        port=os.environ.get(
            "DB_PORT",
            "5432"
        )
    )


# =========================================
# HOME
# =========================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Cyber Awareness Backend is running!"
    }), 200


# =========================================
# REGISTER
# =========================================

@app.route("/api/auth/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No registration data received."
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # -----------------------------
    # Validation
    # -----------------------------

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email, and password are required."
        }), 400

    if len(name) > 100:
        return jsonify({
            "success": False,
            "message": "Name is too long."
        }), 400

    if len(email) > 150:
        return jsonify({
            "success": False,
            "message": "Email is too long."
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters long."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        # Check existing account
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s;
            """,
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            return jsonify({
                "success": False,
                "message": "An account with this email already exists."
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # New users are students by default
        cursor.execute(
            """
            INSERT INTO users
                (name, email, password_hash, role)
            VALUES
                (%s, %s, %s, %s)
            RETURNING id;
            """,
            (
                name,
                email,
                password_hash,
                "student"
            )
        )

        user_id = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful.",
            "user_id": user_id
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        print(
            "Registration database error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to create the account."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# LOGIN
# =========================================

@app.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No login data received."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = %s;
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        user_id = user[0]
        name = user[1]
        user_email = user[2]
        password_hash = user[3]
        role = user[4]

        if not check_password_hash(
            password_hash,
            password
        ):

            return jsonify({
                "success": False,
                "message": "Invalid email or password."
            }), 401

        # ---------------------------------
        # Create authenticated session
        # ---------------------------------

        session.clear()

        session["user_id"] = user_id
        session["role"] = role

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": user_id,
                "name": name,
                "email": user_email,
                "role": role
            }
        }), 200

    except Exception as error:

        print(
            "Login database error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to process login."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# LOGOUT
# =========================================

@app.route("/api/auth/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logout successful."
    }), 200


# =========================================
# CURRENT SESSION
# =========================================

@app.route("/api/auth/me", methods=["GET"])
def get_current_user():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                name,
                email,
                role
            FROM users
            WHERE id = %s;
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:

            session.clear()

            return jsonify({
                "success": False,
                "message": "User account not found."
            }), 401

        return jsonify({
            "success": True,
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[3]
            }
        }), 200

    except Exception as error:

        print(
            "Session verification error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to verify session."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# CREATE REPORT
# =========================================

@app.route("/api/reports", methods=["POST"])
def create_report():

    # ---------------------------------
    # Authenticate user
    # ---------------------------------

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No report data received."
        }), 400

    # IMPORTANT:
    # Do NOT take user_id from the browser.
    # The authenticated session determines the user.

    category = data.get(
        "category",
        ""
    ).strip()

    description = data.get(
        "description",
        ""
    ).strip()

    additional = data.get(
        "additional",
        ""
    ).strip()

    # ---------------------------------
    # Validation
    # ---------------------------------

    if not category:

        return jsonify({
            "success": False,
            "message": "Please select an incident category."
        }), 400

    if not description:

        return jsonify({
            "success": False,
            "message": "Please describe what happened."
        }), 400

    if len(description) > 2000:

        return jsonify({
            "success": False,
            "message": "Description is too long."
        }), 400

    if len(additional) > 1000:

        return jsonify({
            "success": False,
            "message": "Additional information is too long."
        }), 400

    full_description = description

    if additional:

        full_description += (
            "\n\nAdditional Information:\n"
            + additional
        )

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO reports
                (user_id, category, description, status)
            VALUES
                (%s, %s, %s, 'Submitted')
            RETURNING id;
            """,
            (
                user_id,
                category,
                full_description
            )
        )

        report_id = cursor.fetchone()[0]

        connection.commit()

        return jsonify({
            "success": True,
            "message": (
                "Your incident report was "
                "submitted successfully."
            ),
            "report_id": report_id
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        print(
            "Report creation error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to save the report."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# GET MY REPORTS
# =========================================

@app.route("/api/reports", methods=["GET"])
def get_reports():

    # ---------------------------------
    # Authenticate user
    # ---------------------------------

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                category,
                description,
                status,
                created_at
            FROM reports
            WHERE user_id = %s
            ORDER BY created_at DESC;
            """,
            (user_id,)
        )

        rows = cursor.fetchall()

        reports = []

        for row in rows:

            reports.append({
                "id": row[0],
                "category": row[1],
                "description": row[2],
                "status": row[3],
                "created_at": row[4].isoformat()
            })

        return jsonify({
            "success": True,
            "reports": reports
        }), 200

    except Exception as error:

        print(
            "Get reports error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to retrieve reports."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# ADMIN - GET ALL REPORTS
# =========================================

@app.route(
    "/api/admin/reports",
    methods=["GET"]
)
def get_all_reports():

    # ---------------------------------
    # Authenticate admin using session
    # ---------------------------------

    user_id = session.get("user_id")
    role = session.get("role")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    if role != "admin":

        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                reports.id,
                reports.user_id,
                users.name,
                users.email,
                reports.category,
                reports.description,
                reports.status,
                reports.created_at
            FROM reports
            JOIN users
                ON reports.user_id = users.id
            ORDER BY reports.created_at DESC;
            """
        )

        rows = cursor.fetchall()

        reports = []

        for row in rows:

            reports.append({
                "id": row[0],
                "user_id": row[1],
                "name": row[2],
                "email": row[3],
                "category": row[4],
                "description": row[5],
                "status": row[6],
                "created_at": row[7].isoformat()
            })

        return jsonify({
            "success": True,
            "reports": reports
        }), 200

    except Exception as error:

        print(
            "Admin reports error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to retrieve reports."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# ADMIN - UPDATE REPORT STATUS
# =========================================

@app.route(
    "/api/admin/reports/<int:report_id>/status",
    methods=["PUT"]
)
def update_report_status(report_id):

    # ---------------------------------
    # Authenticate admin using session
    # ---------------------------------

    user_id = session.get("user_id")
    role = session.get("role")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Authentication required."
        }), 401

    if role != "admin":

        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json()

    if not data:

        return jsonify({
            "success": False,
            "message": "No status data received."
        }), 400

    new_status = data.get(
        "status",
        ""
    ).strip()

    # ---------------------------------
    # Validate status
    # ---------------------------------

    allowed_statuses = [
        "Submitted",
        "Under Review",
        "Resolved"
    ]

    if new_status not in allowed_statuses:

        return jsonify({
            "success": False,
            "message": "Invalid report status."
        }), 400

    connection = None
    cursor = None

    try:

        connection = get_db_connection()
        cursor = connection.cursor()

        # ---------------------------------
        # Check report exists
        # ---------------------------------

        cursor.execute(
            """
            SELECT id
            FROM reports
            WHERE id = %s;
            """,
            (report_id,)
        )

        report = cursor.fetchone()

        if not report:

            return jsonify({
                "success": False,
                "message": "Report not found."
            }), 404

        # ---------------------------------
        # Update status
        # ---------------------------------

        cursor.execute(
            """
            UPDATE reports
            SET status = %s
            WHERE id = %s;
            """,
            (
                new_status,
                report_id
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": (
                "Report status updated successfully."
            ),
            "status": new_status
        }), 200

    except Exception as error:

        if connection:
            connection.rollback()

        print(
            "Status update error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to update report status."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =========================================
# RUN APPLICATION
# =========================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )