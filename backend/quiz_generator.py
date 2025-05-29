from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# LM Studio local API endpoint (default port)
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

def test_lm_studio_connection():
    try:
        print(f"Testing connection to LM Studio at {LM_STUDIO_URL}")  # Debug log
        response = requests.post(
            LM_STUDIO_URL,
            json={
                "messages": [
                    {"role": "user", "content": "Hello, are you working?"}
                ],
                "temperature": 0.7,
                "max_tokens": 50
            }
        )
        print(f"LM Studio test response status: {response.status_code}")
        print(f"LM Studio test response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"LM Studio connection test failed: {str(e)}")
        return False

# Test endpoint
@app.route('/test', methods=['GET'])
def test():
    lm_studio_status = "connected" if test_lm_studio_connection() else "disconnected"
    return jsonify({
        "status": "Python service is running",
        "lm_studio": lm_studio_status
    })

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        print("Received request to /generate-quiz")  # Debug log
        print("Request headers:", dict(request.headers))  # Debug log
        print("Request body:", request.get_data())  # Debug log
        
        content = request.json.get('content')
        if not content:
            return jsonify({'error': 'Content is required'}), 400

        # Test LM Studio connection first
        if not test_lm_studio_connection():
            print("LM Studio connection test failed")  # Debug log
            return jsonify({
                'error': 'LM Studio is not available',
                'details': 'Please make sure LM Studio is running with a model loaded'
            }), 503

        # Construct the prompt for quiz generation
        prompt = f"""Generate a quiz based on the following content. Create a mix of different question types:

1. Multiple choice questions (with 4 options each and correct answer)
2. Fill-in-the-blank questions
3. True or False questions

For fill-in-the-blank questions:
- Use the subject of the sentence as the blank (the part to be answered)
- The answer MUST be a single word or two words only
- Do not use phrases or sentences as answers
- Make sure the blank is clearly indicated with "_____"
- Example format: "The _____ is the capital of France." (where "Paris" would be the answer)

Content:
{content}

Format each question like this:

Multiple Choice:
Q: [question]
a) [option a]
b) [option b]
c) [option c]
d) [option d]
Correct: [a/b/c/d]

Fill in the Blank:
Fill: [question with _____ for the blank]
Correct: [single word or two words answer]

True or False:
True or False: [question]
a) True
b) False
Correct: [True/False]

IMPORTANT:
- Generate a mix of different question types
- Questions should be diverse and cover different aspects of the content
- Each question should be unique and test different concepts
- For fill-in-the-blank, always use "_____" to indicate the blank
- For fill-in-the-blank answers, use only single words or two words maximum
- Make sure each fill-in-the-blank question has exactly one "_____" in it
- Each fill-in-the-blank question MUST start with "Fill:" followed by the question
- Each fill-in-the-blank answer MUST start with "Correct:" followed by the answer
"""

        # Prepare the request to LM Studio
        lm_request = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1500
        }
        
        print(f"Sending request to LM Studio: {json.dumps(lm_request, indent=2)}")  # Debug log

        # Call LM Studio API with the exact format that works
        response = requests.post(
            LM_STUDIO_URL,
            json=lm_request
        )

        print(f"LM Studio response status: {response.status_code}")  # Debug log
        print(f"LM Studio response headers: {dict(response.headers)}")  # Debug log

        if response.status_code != 200:
            error_text = response.text
            print(f"LM Studio API error response: {error_text}")  # Debug log
            return jsonify({
                'error': f'LM Studio API error: {response.status_code}',
                'details': error_text
            }), response.status_code

        # Extract the generated text from LM Studio's response
        response_data = response.json()
        print(f"LM Studio response data: {json.dumps(response_data, indent=2)}")  # Debug log
        
        generated_text = response_data['choices'][0]['message']['content']
        
        return jsonify([{
            'generated_text': generated_text
        }])

    except Exception as e:
        print(f"Server error: {str(e)}")  # Debug log
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Python service on port 5001...")  # Debug log
    print("Testing LM Studio connection...")  # Debug log
    if test_lm_studio_connection():
        print("LM Studio connection successful!")  # Debug log
    else:
        print("Warning: Could not connect to LM Studio. Make sure it's running with a model loaded.")  # Debug log
    app.run(host='0.0.0.0', port=5001, debug=True)  # Listen on all interfaces 