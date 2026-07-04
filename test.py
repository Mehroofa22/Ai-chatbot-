import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key starting with: {api_key[:10]}...")

genai.configure(api_key=api_key)

try:
    print("Listing models:")
    for m in genai.list_models():
        print(f" - {m.name} (supports: {m.supported_generation_methods})")
except Exception as e:
    print(f"Error listing models: {e}")
