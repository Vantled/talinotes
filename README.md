#How to run server and backend

1. Build the app first
- cd talinotes
- npm run build && npx cap sync ios (zsh terminal)

2. Run backend (node) (bash terminal)
- cd backend
- npm run dev

3. Run backend (LLM) (bash terminal)
- cd backend
- source venv/bin/activate
- python3 quiz_generator.py

3 Terminals in total
    a. Building the app
    b. Backend node
    c. Backend LLM for quiz generation