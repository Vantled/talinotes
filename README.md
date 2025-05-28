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

#How to install the app to another ios device

1. Get your friend's device UDID:
    - Connect the device to a Mac
    - Open Finder
    - Click on the device
    - Click on the device name to reveal the UDID
    - Copy the UDID

2. Add the device to your development profile:
    - Open Xcode
    - Go to Window → Devices and Simulators
    - Click the "+" button
    - Add the UDID you copied

3. Build and run the app on Xcode.
    - Select the device as your build target.
    - Build and run the app.

IMPORTANT - On the ios target device, trust the developer certificate first.
    a. Settings > General > Device Management > Trust