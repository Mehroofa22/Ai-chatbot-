from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

# Configure the API key safely, with a warning if missing
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("Warning: GEMINI_API_KEY is not set.")

# Configure the model to use a valid supported name (gemini-2.5-flash)
model = genai.GenerativeModel("gemini-2.5-flash")

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    # Fix unsafe JSON parsing
    data = request.get_json(silent=True)
    if not data or "message" not in data:
        return jsonify({"reply": "Error: Missing or invalid message in request."}), 400

    user_message = data["message"]

    # Fix lack of error handling around API generation calls
    try:
        response = model.generate_content(user_message)
        try:
            reply_text = response.text
            if not reply_text:
                reply_text = "The model returned an empty response."
        except ValueError:
            reply_text = "I'm sorry, I cannot generate a response to that message as it was blocked by safety settings."
        
        return jsonify({
            "reply": reply_text
        })
    except Exception as e:
        return jsonify({
            "reply": f"An error occurred: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(debug=True)