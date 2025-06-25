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

# Project Setup Guide

## Prerequisites

- Node.js and npm installed
- Python 3.12 installed
- Expo CLI (run via `npx expo start`)
- Firebase project with Firestore enabled and service account JSON key

---

## Frontend Setup

1. Navigate to the folder containing `package.json`

2. Install dependencies:

    ```bash
    npm install
    ```

3. Open `services/groceryapi.js` and update the IP address to your local machine's IPv4 address:

    - On Windows, run `ipconfig` to find the IPv4 address (e.g., `192.168.x.x`)

4. Start the Expo development server:

    ```bash
    npx expo start
    ```

5. Install **Expo Go** from your device's app store

6. Connect your device and development machine to the **same Wi-Fi network**

7. Scan the QR code in the terminal or Expo DevTools to launch the app on your device

---

## Backend Setup

1. Navigate to the backend directory

2. Create and activate a Python 3.12 virtual environment:

    ```bash
    py -3.12 -m venv venv
    ```

    - **Windows PowerShell:**

      ```powershell
      .\venv\Scripts\activate.ps1
      ```

    - **Command Prompt:**

      ```cmd
      venv\Scripts\activate.bat
      ```

3. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Download your Firebase private key JSON file from the Firebase Console under:

    ```
    Project Settings > Service Accounts
    ```

5. Rename the file to `firebase_key.json` and place it in the same directory as `main.py`

6. Run the backend server:

    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

7. Access the API docs at:

    ```
    http://localhost:8000/docs
    ```

---

## Notes

- Run frontend and backend servers concurrently in **separate terminals**
- Ensure your **mobile device** and development machine are on the **same network** for Expo Go connectivity
