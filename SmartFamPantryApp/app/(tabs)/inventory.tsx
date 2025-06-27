// app/inventory.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator,
  Alert, TouchableOpacity, Button, Platform
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import {
  collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, where, Query, getDoc // Import getDoc
} from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../firebaseConfig'; // Ensure db is imported

const ITEM_CATEGORIES = [
  'All', 'Dairy & Eggs', 'Produce', 'Meat & Seafood', 'Pantry', 'Frozen',
  'Beverages', 'Snacks', 'Household', 'Personal Care', 'Other'
];

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: Date;
  addedBy: string;
  timestamp: Date;
  category: string;
}

// --- Function definitions for isExpiringSoon and isLowStock ---
// Moved to the top, before any usage in the component logic.

const isExpiringSoon = (expiryDate: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to start of day
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from today
  return expiryDate.getTime() <= sevenDaysFromNow.getTime();
};

// MODIFIED: isLowStock now takes the threshold as an argument
const isLowStock = (quantity: number, threshold: number): boolean => {
  return quantity <= threshold;
};


const InventoryScreen: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemExpiryDate, setNewItemExpiryDate] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(ITEM_CATEGORIES[1]);
  const [loading, setLoading] = useState(true);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  const scanProcessingRef = useRef(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { user, familyId, loadingAuth, loadingUserData } = useUser();

  // NEW: State for low stock threshold, with a default
  // Initialize as null or undefined so we can check if it's been fetched yet
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(null);

  // NEW: Effect to fetch the low stock threshold from Firestore
  useEffect(() => {
    const fetchFamilySettings = async () => {
      if (familyId) {
        try {
          const familyRef = doc(db, 'families', familyId);
          const docSnap = await getDoc(familyRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Set threshold from Firestore, or default to 5 if not found
            setLowStockThreshold(data.lowStockThreshold !== undefined ? data.lowStockThreshold : 5);
          } else {
            setLowStockThreshold(5); // Default if family doc doesn't exist
          }
        } catch (error) {
          console.error("Error fetching family settings:", error);
          setLowStockThreshold(5); // Fallback to default on error
        }
      } else {
          setLowStockThreshold(5); // Set to default immediately if no familyId
      }
    };
    fetchFamilySettings();
  }, [familyId]); // Re-fetch if familyId changes

  // Use the fetched lowStockThreshold in the filter
  // Ensure lowStockThreshold is not null before using it
  const lowStockOrExpiringItems = inventoryItems.filter(item =>
    isLowStock(item.quantity, lowStockThreshold ?? 5) || isExpiringSoon(item.expiryDate)
    // Using nullish coalescing (??) to use 5 as a fallback if lowStockThreshold is null
  );


  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  const fetchInventory = useCallback(async () => {
    if (!familyId) {
      console.log("InventoryScreen: No familyId available for fetching inventory.");
      setLoading(false);
      setInventoryItems([]);
      return;
    }

    setLoading(true);
    try {
      let q: Query = collection(db, 'families', familyId, 'inventory');

      if (selectedCategory !== 'All') {
        q = query(q, where('category', '==', selectedCategory));
      }

      const snapshot = await getDocs(q);
      const items: InventoryItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          quantity: data.quantity || 1,
          expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate),
          addedBy: data.addedBy,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          category: data.category || 'Other',
        };
      });
      items.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
      setInventoryItems(items);
    } catch (err: any) {
      Alert.alert('Error fetching inventory', err.message);
    } finally {
      setLoading(false);
    }
  }, [familyId, selectedCategory]);

  useEffect(() => {
    // Only fetch inventory if authentication and user data (including familyId) are loaded,
    // AND lowStockThreshold has been fetched.
    if (!loadingAuth && !loadingUserData && lowStockThreshold !== null) {
      if (user && familyId) {
        fetchInventory();
      } else {
        setInventoryItems([]);
        setLoading(false);
      }
    }
  }, [loadingAuth, loadingUserData, user, familyId, fetchInventory, lowStockThreshold]); // Added lowStockThreshold to dependencies

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    if (scanProcessingRef.current) {
      return;
    }
    scanProcessingRef.current = true;

    setScanning(false);
    setScanned(true);

    Alert.alert(`Barcode Scanned!`, `Type: ${type}\nData: ${data}`, [
      {
        text: 'OK', onPress: () => {
          setScanned(false);
          scanProcessingRef.current = false;
        }
      },
    ]);

    try {
      const productLookupUrl = `https://world.openfoodfacts.org/api/v0/product/${data}.json`;
      const response = await fetch(productLookupUrl);
      const json = await response.json();

      if (json.status === 1 && json.product) {
        const productName = json.product.product_name || `Scanned Item (${data})`;
        setNewItemName(productName);
      } else {
        Alert.alert('Product Not Found', `Could not find details for barcode: ${data}. Please enter manually.`);
        setNewItemName(`Scanned Item (${data})`);
      }
    } catch (error: any) {
      console.error("Error looking up product:", error);
      Alert.alert('Product Lookup Error', 'Failed to fetch product details. Please enter manually.');
      setNewItemName(`Scanned Item (${data})`);
    }
  };

  const handleAddItem = async () => {
    const parsedQty = parseInt(newItemQuantity, 10);
    const parsedDate = new Date(newItemExpiryDate);

    if (!newItemName || isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedDate.getTime()) || !user || !familyId) {
      Alert.alert('Invalid Input', 'Please fill all fields correctly and ensure you are logged in to a family.');
      return;
    }

    try {
      const newItem = {
        name: newItemName,
        quantity: parsedQty,
        expiryDate: parsedDate,
        addedBy: user.email || user.uid,
        timestamp: new Date(),
        category: newItemCategory,
      };
      const docRef = await addDoc(collection(db, 'families', familyId, 'inventory'), newItem);
      setInventoryItems((prev) => {
        const updated = [...prev, { ...newItem, id: docRef.id }];
        updated.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
        return updated;
      });
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemExpiryDate('');
      setNewItemCategory(ITEM_CATEGORIES[1]);

      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error adding item', err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!familyId) {
      Alert.alert("Error", "Family ID not available. Cannot delete item.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'families', familyId, 'inventory', id));
      setInventoryItems((prev) => prev.filter((item) => item.id !== id));
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error deleting item', err.message);
    }
  };

  const handleUpdateQuantity = async (id: string, delta: number) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return;
    const newQuantity = item.quantity + delta;
    if (newQuantity < 0) return;

    if (!familyId) {
      Alert.alert("Error", "Family ID not available. Cannot update quantity.");
      return;
    }

    try {
      const itemRef = doc(db, 'families', familyId, 'inventory', id);
      await updateDoc(itemRef, { quantity: newQuantity });
      fetchInventory();
    } catch (err: any) {
      Alert.alert('Error updating quantity', err.message);
    }
  };

  const handleAddToGroceryList = async (item: InventoryItem) => {
    if (!user || !familyId) {
      Alert.alert("Error", "Please log in and ensure your family is set up to add to grocery list.");
      return;
    }

    try {
      const groceryItem = {
        name: item.name,
        quantity: item.quantity,
        addedBy: user.email || user.uid,
        completed: false,
        timestamp: new Date(),
        category: item.category,
      };
      await addDoc(collection(db, 'families', familyId, 'groceries'), groceryItem);
      Alert.alert("Success", `${item.name} added to grocery list!`);
    } catch (error: any) {
      Alert.alert("Error", `Failed to add ${item.name} to grocery list: ${error.message}`);
    }
  };

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;

  if (hasCameraPermission === null) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.permissionText}>Requesting for camera permission...</Text>
        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 20 }} />
      </View>
    );
  }
  if (hasCameraPermission === false) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.permissionText}>No access to camera. Please enable camera permissions in your device settings to use the barcode scanner.</Text>
      </View>
    );
  }
  // Check lowStockThreshold is loaded too. If it's still null, we're waiting for the setting to fetch.
  if (loadingAuth || loadingUserData || loading || lowStockThreshold === null) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color="#3182CE" />;
  }

  if (!user || !familyId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Please log in and ensure your family is set up to view your inventory.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Conditional summary banner */}
      {lowStockOrExpiringItems.length > 0 ? (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ You have {lowStockOrExpiringItems.length} item
            {lowStockOrExpiringItems.length > 1 ? 's' : ''} expiring soon or low in stock!
          </Text>
        </View>
      ) : null}

      <Text style={styles.header}>🏡 Household Inventory</Text>
      <Text style={styles.subHeader}>Keep track of pantry & essentials</Text>

      <View style={styles.categoryFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ITEM_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextSelected,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {scanning ? (
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["upc_a", "ean13", "ean8", "qr"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <Text style={styles.scanText}>Scan Barcode</Text>
            <TouchableOpacity style={styles.cancelScanButton} onPress={() => { setScanning(false); setScanned(false); scanProcessingRef.current = false; }}>
              <Text style={styles.cancelScanButtonText}>Cancel Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Item name"
            placeholderTextColor="#4A5568"
            value={newItemName}
            onChangeText={setNewItemName}
          />
          <View style={styles.row}>
            <TextInput
              style={styles.smallInput}
              placeholder="Qty"
              placeholderTextColor="#4A5568"
              value={newItemQuantity}
              keyboardType="numeric"
              onChangeText={(text) => setNewItemQuantity(text.replace(/[^0-9]/g, ''))}
            />
            <TextInput
              style={styles.largeInput}
              placeholder="Expiry (YYYY-MM-DD)"
              placeholderTextColor="#4A5568"
              value={newItemExpiryDate}
              onChangeText={setNewItemExpiryDate}
            />
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newItemCategory}
              onValueChange={(itemValue: string) => setNewItemCategory(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {ITEM_CATEGORIES.slice(1).map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setScanning(true); setScanned(false); }} style={styles.scanButton}>
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
        </View>
      )}

      {!scanning && inventoryItems.map((item) => (
        <View key={item.id} style={styles.itemCard}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.itemTitle,
                isExpiringSoon(item.expiryDate) && styles.expiring,
                // Pass lowStockThreshold, using nullish coalescing for safety
                isLowStock(item.quantity, lowStockThreshold ?? 5) && styles.lowStockText
              ]}
            >
              {item.name} ({item.quantity})
            </Text>
            <Text style={styles.itemText}>Category: {item.category || 'N/A'}</Text>
            <Text style={styles.itemText}>Expires: {formatDate(item.expiryDate)}</Text>
            <Text style={styles.itemText}>Added by: {item.addedBy}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => handleAddToGroceryList(item)} style={styles.addToGroceryButton}>
              <Text style={styles.addToGroceryButtonText}>🛒</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, -1)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 18 }}>➖</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, 1)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 18 }}>➕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!scanning && inventoryItems.length === 0 && <Text style={styles.empty}>No items yet. Start adding!</Text>}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7FAFC',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 14,
    textAlign: 'center',
    color: '#718096',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#EDF2F7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  smallInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  largeInput: {
    flex: 2,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  addButton: {
    backgroundColor: '#3182CE',
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  itemText: {
    fontSize: 13,
    color: '#4A5568',
    marginTop: 2,
  },
  deleteText: {
    fontSize: 20,
    color: '#E53E3E',
    marginLeft: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginTop: 20,
    fontSize: 16,
  },
  expiring: {
    color: '#E53E3E',
  },
  lowStockText: {
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  alertBanner: {
    backgroundColor: '#F56565',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 15,
  },
  permissionText: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    height: 300,
    width: '100%',
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 10,
    position: 'relative',
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 50,
  },
  scanButton: {
    backgroundColor: '#63B3ED',
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelScanButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelScanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addToGroceryButton: {
    backgroundColor: '#A0D9B1',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
  addToGroceryButtonText: {
    fontSize: 18,
    color: '#2F855A',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 15,
    zIndex: 10,
  },
  picker: {
    width: '100%',
    height: '450%',
    backgroundColor: 'transparent',
    fontSize: 14,
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
    // @ts-ignore
    textAlignVertical: 'center',
  },
  pickerItem: {
    fontSize: 14,
    color: '#2D3748',
  },
  categoryFilterContainer: {
    marginBottom: 15,
    height: 40,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#3182CE',
  },
  categoryButtonText: {
    color: '#4A5568',
    fontWeight: 'bold',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
});

export default InventoryScreen;