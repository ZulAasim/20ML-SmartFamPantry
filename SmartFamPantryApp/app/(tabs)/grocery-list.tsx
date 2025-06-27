// app/(tabs)/grocery-list.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef for unsubscribe
import {
  View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator,
  Alert, TouchableOpacity, ScrollView, Image, Linking, Platform
} from 'react-native';
import { auth, db } from '../../firebaseConfig.js';
// Import onSnapshot and Query for real-time updates and explicit typing
import { collection, query, addDoc, deleteDoc, doc, where, onSnapshot, Query } from 'firebase/firestore';
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker';

const ITEM_CATEGORIES = [
  'All', // For filtering
  'Dairy & Eggs',
  'Produce',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care',
  'Other'
];

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  addedBy: string;
  completed: boolean;
  timestamp: Date;
  category: string;
}

const GroceryListScreen: React.FC = () => {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState(ITEM_CATEGORIES[1]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { user, familyId, loadingAuth, loadingUserData } = useUser();
  // Ref to store the unsubscribe function for the Firestore listener
  const unsubscribeGroceryListenerRef = useRef<(() => void) | null>(null);


  // Modified to use onSnapshot for real-time updates
  const setupGroceryListener = useCallback(() => {
    if (!familyId) {
      console.log("GroceryListScreen: No familyId available for setting up grocery listener.");
      setLoading(false);
      setGroceries([]);
      // Ensure any previous listener is unsubscribed if familyId becomes null
      if (unsubscribeGroceryListenerRef.current) {
        unsubscribeGroceryListenerRef.current();
        unsubscribeGroceryListenerRef.current = null;
      }
      return;
    }

    setLoading(true);
    console.log(`GroceryListScreen: Setting up Firestore listener for familyId: ${familyId}, category: ${selectedCategory}`);

    // Explicitly type q as Query to handle the re-assignment
    let q: Query = collection(db, "families", familyId, "groceries");

    if (selectedCategory !== 'All') {
      q = query(q, where('category', '==', selectedCategory));
    }

    // Unsubscribe from any existing listener before setting up a new one
    if (unsubscribeGroceryListenerRef.current) {
      unsubscribeGroceryListenerRef.current();
      console.log("GroceryListScreen: Unsubscribed from previous grocery listener.");
    }

    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("GroceryListScreen: Firestore snapshot received.");
      const items: GroceryItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          quantity: data.quantity || 1,
          addedBy: data.addedBy,
          completed: data.completed,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          category: data.category || 'Other',
        };
      });
      setGroceries(items);
      setLoading(false);
    }, (error) => {
      console.error("GroceryListScreen: Error listening to groceries:", error);
      Alert.alert("Error fetching groceries", error.message);
      setLoading(false);
    });

    // Store the unsubscribe function in the ref
    unsubscribeGroceryListenerRef.current = unsubscribe;

    // Return the unsubscribe function for cleanup when the component unmounts
    // or when dependencies change and a new listener is set up.
    return unsubscribe;

  }, [familyId, selectedCategory]); // Dependencies for the listener effect


  // useEffect to manage the real-time listener lifecycle
  useEffect(() => {
    // Only set up the listener if authentication and user data are loaded
    if (!loadingAuth && !loadingUserData) {
      if (user && familyId) {
        // Call the setup function to start or update the listener
        const unsubscribe = setupGroceryListener();
        return () => {
          // Cleanup: Unsubscribe when component unmounts or effect re-runs
          if (unsubscribe) {
            unsubscribe();
            console.log("GroceryListScreen: Cleanup useEffect unsubscribed grocery listener.");
          }
        };
      } else {
        // No user or familyId, clear groceries and stop loading
        if (unsubscribeGroceryListenerRef.current) {
            unsubscribeGroceryListenerRef.current();
            unsubscribeGroceryListenerRef.current = null;
        }
        setGroceries([]);
        setLoading(false);
      }
    }
  }, [loadingAuth, loadingUserData, user, familyId, setupGroceryListener]); // Add setupGroceryListener to dependencies


  const handleAddItem = async () => {
    const parsedQty = parseInt(newItemQuantity, 10);
    if (!newItemName || isNaN(parsedQty) || parsedQty <= 0 || !user || !familyId) {
      Alert.alert("Invalid Input", "Please enter a valid name and quantity, and ensure you are logged in to a family.");
      return;
    }

    try {
      const newItem = {
        name: newItemName,
        quantity: parsedQty,
        addedBy: user.email || user.uid,
        completed: false,
        timestamp: new Date(),
        category: newItemCategory,
      };
      // addDoc will trigger the onSnapshot listener, which will then update the state
      await addDoc(collection(db, "families", familyId, "groceries"), newItem);
      // No need to manually update local state with setGroceries here, onSnapshot will handle it.
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemCategory(ITEM_CATEGORIES[1]);
    } catch (error: any) {
      Alert.alert("Error adding item", error.message);
    }
  };


  const handleDeleteItem = async (id: string) => {
    if (!familyId) {
      Alert.alert("Error", "Family ID not available. Cannot delete item.");
      return;
    }
    try {
      // deleteDoc will trigger the onSnapshot listener, which will then update the state
      await deleteDoc(doc(db, "families", familyId, "groceries", id));
      // No need to manually update local state with setGroceries here, onSnapshot will handle it.
    } catch (error: any) {
      Alert.alert("Error deleting item", error.message);
    }
  };

  // Loading state for the screen (covers initial auth, user data, and grocery fetch)
  if (loadingAuth || loadingUserData || loading) {
    return <ActivityIndicator size="large" color="#3182CE" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // Handle cases where user or familyId is not available after loading
  if (!user || !familyId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Please log in and ensure your family is set up to view the grocery list.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🛒 Grocery List</Text>
      <Text style={styles.subHeader}>Manage your family's shopping list</Text>

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

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          placeholderTextColor="#4A5568"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={[styles.input, { marginBottom: 15 }]}
          placeholder="Quantity"
          placeholderTextColor="#4A5568"
          keyboardType="numeric"
          value={newItemQuantity}
          onChangeText={(text) => setNewItemQuantity(text.replace(/[^0-9]/g, ''))}
        />
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

        <TouchableOpacity
          onPress={handleAddItem} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {groceries.length === 0 ? (
        <Text style={styles.empty}>No groceries added yet.</Text>
      ) : (
        groceries.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{`${item.name} (${item.quantity})`}</Text>
              <Text style={styles.itemText}>Category: {item.category || 'N/A'}</Text>
              <Text style={styles.itemText}>Added by: {item.addedBy}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.orderCard}>
        <Text style={styles.orderHeader}>Need to order something?</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://mart.grab.com/sg/en?is_retargeting=true&af_sub1=order_now&c=organic_web&af_ad=sg&pid=organic_web&af_channel=mart&af_adset=grab_website&af_force_deeplink=true"
              )
            }
          >
            <Image
              source={require('../../assets/images/Grab.jpg')}
              style={styles.appIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://www.foodpanda.sg/restaurants/new?lat=1.36675&lng=103.85656&vertical=shop"
              )
            }
          >
            <Image
              source={require('../../assets/images/FoodPanda-logo.jpg')}
              style={styles.appIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
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
  addButton: {
    backgroundColor: '#3182CE',
    marginTop: 10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orderCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0FFF4',
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#C6F6D5',
    borderWidth: 1,
  },
  orderHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2F855A',
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
  },
  appIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
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
    height: '450%', // This height is unusual, might cause clipping issues for the dropdown itself
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#1A202C',
    paddingVertical: Platform.OS === 'android' ? 2 : 0,
    // @ts-ignore
    textAlignVertical: 'center',
  },
  pickerItem: {
    fontSize: 16,
    color: '#1A202C',
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

export default GroceryListScreen;