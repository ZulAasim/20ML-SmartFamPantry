# main.py
# to run $ uvicorn main:app --reload --host 0.0.0.0 --port 8000 
# to test http://localhost:8000/docs in browser to see FastAPI's interactive documentation and test your endpoints

from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore as google_firestore


# --- Firebase Initialization ---
# Ensure your firebase_key.json is in the same directory as this script
try:
    cred = credentials.Certificate("firebase_key.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully!")
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    # You might want to exit or handle this error more gracefully in production
    # For development, if this fails, check your firebase_key.json path and content.

app = FastAPI(
    title="Smart Fam Pantry API",
    description="Backend for managing family grocery lists and pantry items."
)

# --- Pydantic Models ---
class GroceryItemCreate(BaseModel):
    name: str
    added_by: str # This should ideally come from an authenticated user ID/name
    family_id: str

class GroceryItemResponse(BaseModel):
    id: str # This will be the Firestore document ID
    name: str
    addedBy: str # Note: Firebase often converts 'added_by' to 'addedBy'
    completed: bool
    timestamp: datetime

# --- Root Endpoint (Health Check) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Fam Pantry API!"}

# --- Add Grocery Item ---
@app.post("/groceries", response_model=dict)
async def add_item(item: GroceryItemCreate):
    try:
        data = {
            "name": item.name,
            "addedBy": item.added_by, # Using 'addedBy' to match potential Firestore auto-conversion
            "completed": False,
            "timestamp": firestore.SERVER_TIMESTAMP # Use server timestamp for consistency
        }
        # Reference the subcollection within a specific family document
        doc_ref = db.collection("families").document(item.family_id).collection("groceries").document()
        doc_ref.set(data)
        return {"message": "Item added successfully", "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item: {e}")

# --- Get All Grocery Items for a Family ---
@app.get("/groceries/{family_id}", response_model=list[GroceryItemResponse])
async def get_items(family_id: str):
    try:
        print(f"DEBUG: Attempting to fetch groceries for family_id: {family_id}")
        groceries_ref = db.collection("families").document(family_id).collection("groceries")
        docs = groceries_ref.stream() # Streams document snapshots
        
        items = []
        for doc in docs:
            item_data = doc.to_dict()
            if item_data: # Ensure data exists before processing
                item_data['id'] = doc.id
                if 'timestamp' in item_data:
                # 'DatetimeWithNanoseconds' is already datetime-like,
                # so assign it directly. Pydantic should handle it.
                    pass # No conversion needed, it's already in a compatible format.
                items.append(item_data)
        
        print(f"DEBUG: Successfully fetched {len(items)} items.")
        return items
    except Exception as e:
        print(f"ERROR: Detailed error in get_items for family {family_id}: {e}")
        import traceback
        traceback.print_exc() # This will force a full traceback print
        raise HTTPException(status_code=500, detail=f"Failed to retrieve items: {e}")

# --- Delete a Grocery Item ---
@app.delete("/groceries/{family_id}/{item_id}", response_model=dict)
async def delete_item(family_id: str, item_id: str):
    try:
        doc_ref = db.collection("families").document(family_id).collection("groceries").document(item_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Item not found")
            
        doc_ref.delete()
        return {"message": "Item deleted successfully"}
    except HTTPException as e:
        raise e # Re-raise HTTPException directly
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {e}")

# --- Optional: Update a Grocery Item (Example) ---
class GroceryItemUpdate(BaseModel):
    name: str = None
    completed: bool = None

@app.put("/groceries/{family_id}/{item_id}", response_model=dict)
async def update_item(family_id: str, item_id: str, update_data: GroceryItemUpdate):
    try:
        doc_ref = db.collection("families").document(family_id).collection("groceries").document(item_id)
        
        # Convert Pydantic model to dictionary, excluding None values
        update_dict = update_data.model_dump(exclude_unset=True) 
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields provided for update.")

        doc_ref.update(update_dict)
        return {"message": "Item updated successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {e}")