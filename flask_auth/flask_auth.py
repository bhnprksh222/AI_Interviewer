from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
)
import os

# ✅ Manually load `.env` file
env_path = os.path.join(
    os.path.dirname(__file__), "..", ".env"
)  # Adjusted to load from project root
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line:
                key, value = line.strip().split("=", 1)
                os.environ[key] = value

# ✅ Get environment variables manually
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

# ✅ Debugging: Print environment values to confirm they are loaded
print(f"📢 DATABASE_URL from .env: {DATABASE_URL}")
print(f"📢 SECRET_KEY from .env: {SECRET_KEY}")

app = Flask(__name__)

# ✅ Load Configurations
app.config["DATABASE_URI"] = DATABASE_URL
app.config["SECRET_KEY"] = SECRET_KEY

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)


# ✅ FIX: Replacing `@app.before_first_request` with `init_app()`
def init_app():
    with app.app_context():
        db.create_all()


init_app()


@app.route("/flask/signup", methods=["POST"])
def flask_signup():
    data = request.get_json()
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    new_user = User(
        username=data["username"], email=data["email"], password_hash=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully!"})


@app.route("/flask/login", methods=["POST"])
def flask_login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id)
    return jsonify({"token": token})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
