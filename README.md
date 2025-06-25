# SmartFamPantry App

## SmartFamPantryApp

This is the frontend code

Getting started:
- install node.js and npm
- cd into package.json
- this file contains all the necessary dependencies, download them
- Under this folder, go to services folder and open groceryapi.js in a code editor
- Change the IP Address to your local machine's IP Address (the one you're running the code)
- You can get it by running ipconfig on your terminal, should be the one followed after IPv4
- you have successfully set-up your machine for frontend

## SmartFamPantryAppbackend

This is the backend code

Getting started:
- Install python 3.12 (has to be this specific version, as pylantic only supports python 3.12)
- Create Python 3.12 venv (py -3.12 -m venv venv)
- Activate it (.\venv\Scripts\activate.ps1 (PowerShell) or venv\Scripts\activate.bat (Command Prompt) )
- Install dependencies (pip install -r requirements.txt)
- Go to Firebase, Go to console, SmartFamPantry Project, Firebase Database, Services, Download private key/json file.
- Rename it to firebase_key.json and place it in the same directory as main.py (backend)
- To run the backend (uvicorn main:app --reload --host 0.0.0.0 --port 8000)
- To test http://localhost:8000/docs in browser to see FastAPI's interactive documentation and test your endpoints

  NOTE: Frontend and backend codes should be running in separate terminal concurrently



Where it all comes together:

- Go back to the terminal running the frontend, run npx expo start
- Download Expo Go on your iphone
- Both your Iphone and Machine should be connected to the same wifi network
- Scan the QR Code shown in your terminal with your Iphone camera
- It should have brought you to the Expo Go App and opened the App


Notes

    Run frontend and backend servers concurrently in separate terminals
