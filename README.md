# SmartFamPantry App

**SmartFamPantry** is a full-stack app that helps families manage their pantry inventory, track expiry dates, and coordinate grocery needs efficiently.

## Tech Stack

- **Frontend:** React Native (Expo)  
- **Backend:** FastAPI (Python 3.12)  
- **Database:** Firebase Firestore  
- **Demo:** Expo Go app for mobile preview

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/your-username/SmartFamPantryApp.git
cd SmartFamPantryApp

Prerequisites

    Node.js and npm installed

    Python 3.12 installed

    Expo CLI (run via npx expo start)

    Firebase project with Firestore enabled and service account JSON key

Frontend Setup

    Navigate to the folder containing package.json

    Install dependencies:

bash

npm install

    Open services/groceryapi.js and update the IP address to your local machine's IPv4 address:

    On Windows, run ipconfig to find the IPv4 address (e.g., 192.168.x.x)

    Start the Expo development server:

bash

npx expo start

    Install Expo Go from your device's app store

    Connect your device and development machine to the same Wi-Fi network

    Scan the QR code in the terminal or Expo DevTools to launch the app on your device

Backend Setup

    Navigate to the backend directory

    Create and activate a Python 3.12 virtual environment:

bash

py -3.12 -m venv venv

    Windows PowerShell:

powershell

.\venv\Scripts\activate.ps1

    Command Prompt:

cmd

venv\Scripts\activate.bat

    Install dependencies:

bash

pip install -r requirements.txt

    Download your Firebase private key JSON file from the Firebase Console under:

text

Project Settings > Service Accounts

    Rename the file to firebase_key.json and place it in the same directory as main.py

    Run the backend server:

bash

uvicorn main:app --reload --host 0.0.0.0 --port 8000

    Access the API docs at:

text

http://localhost:8000/docs

Notes

    Run frontend and backend servers concurrently in separate terminals
