
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL", "gpt-5.5")

print("API key loaded:", bool(key))
print("Model configured:", model)

if not key:
    print("ERROR: OPENAI_API_KEY was not found in .env")
else:
    try:
        client = OpenAI(api_key=key)

        result = client.embeddings.create(
            model="text-embedding-3-small",
            input=["Testing the ComplyAI embedding API."]
        )

        print("SUCCESS: Embeddings API is working.")
        print("Vector length:", len(result.data[0].embedding))

    except Exception as exc:
        print("ERROR TYPE:", type(exc).__name__)
        print("ERROR DETAILS:", str(exc))
