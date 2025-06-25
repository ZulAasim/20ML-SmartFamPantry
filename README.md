# SmartFamPantry App

**SmartFamPantry** is a full-stack application designed to help families manage their household pantry inventory, track item expiry dates, and coordinate grocery needs efficiently.

---

## Tech Stack

- **Frontend:** React Native (Expo)  
- **Backend:** FastAPI (Python 3.12)  
- **Database:** Firebase Firestore  
- **Demo & Testing:** Expo Go app for mobile preview

---

## Getting Started

### Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone https://github.com/your-username/SmartFamPantryApp.git
cd SmartFamPantryApp

Prerequisites

    Node.js and npm installed on your machine

    Python 3.12 installed (required for backend compatibility)

    Expo CLI (comes with npx expo start)

    Firebase project with Firestore enabled and service account key

Frontend Setup (SmartFamPantryApp)

    Navigate to the folder containing package.json.

    Install dependencies:

npm install

Update the IP address in services/groceryapi.js to your local machine’s IPv4 address:

    On Windows, run ipconfig in terminal to find IPv4 address (e.g., 192.168.x.x).

Start the Expo development server:

    npx expo start

    On your mobile device, install Expo Go from the app store.

    Ensure your mobile device and development machine are connected to the same Wi-Fi network.

    Scan the QR code shown in the terminal or Expo DevTools with your phone camera.

    The app will launch on your device within Expo Go.

Backend Setup (SmartFamPantryAppBackend)

    Navigate to the backend project directory.

    Create and activate a Python 3.12 virtual environment:

# Windows PowerShell
py -3.12 -m venv venv
.\venv\Scripts\activate.ps1

Install required dependencies:

pip install -r requirements.txt

Go to your Firebase Console > Project > Settings > Service Accounts, and download your private key JSON file.

Rename the file to firebase_key.json and place it in the same directory as main.py.

Start the FastAPI backend server:

uvicorn main:app --reload --host 0.0.0.0 --port 8000

Access the API documentation and test endpoints at:

    http://localhost:8000/docs

Important Notes

    Both frontend and backend servers should be running concurrently in separate terminals.

    Make sure your mobile device and development machine are on the same Wi-Fi network for Expo Go to connect properly.

    The mobile_movie_app folder is only for demo/testing purposes and not part of the main app.

