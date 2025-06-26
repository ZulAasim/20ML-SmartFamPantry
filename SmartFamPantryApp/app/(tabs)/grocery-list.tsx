// app/(tabs)/grocery-list.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
 View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator,
 Alert, TouchableOpacity, ScrollView, Image, Linking, Platform // Import Platform
} from 'react-native';
import { auth, db } from '../../firebaseConfig.js';
import { collection, query, getDocs, addDoc, deleteDoc, doc, where, Query } from 'firebase/firestore'; // Import Query
import { useUser } from '../../context/UserContext';
import { Picker } from '@react-native-picker/picker'; // Import Picker


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


 const fetchGroceries = useCallback(async () => {
   if (!familyId) {
     console.log("GroceryListScreen: No familyId available for fetching groceries.");
     setLoading(false);
     setGroceries([]);
     return;
   }


   setLoading(true);
   try {
     let q: Query = collection(db, "families", familyId, "groceries"); // FIX: Declare q as Query


     if (selectedCategory !== 'All') {
       q = query(q, where('category', '==', selectedCategory));
     }


     const snapshot = await getDocs(q);
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
   } catch (error: any) {
     Alert.alert("Error fetching groceries", error.message);
   } finally {
     setLoading(false);
   }
 }, [familyId, selectedCategory]);


 useEffect(() => {
   if (!loadingAuth && !loadingUserData) {
     if (user && familyId) {
       fetchGroceries();
     } else {
       setGroceries([]);
       setLoading(false);
     }
   }
 }, [loadingAuth, loadingUserData, user, familyId, fetchGroceries]);


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
     const docRef = await addDoc(collection(db, "families", familyId, "groceries"), newItem);
     setGroceries(prev => [...prev, { ...newItem, id: docRef.id }]);
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
     await deleteDoc(doc(db, "families", familyId, "groceries", id));
     setGroceries(prev => prev.filter(item => item.id !== id));
   } catch (error: any) {
     Alert.alert("Error deleting item", error.message);
   }
 };


 if (loadingAuth || loadingUserData || loading) {
   return <ActivityIndicator size="large" color="#3182CE" style={{ flex: 1, justifyContent: 'center' }} />;
 }


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
       {/* FIX: Add margin to the Quantity input for spacing */}
       <TextInput
         style={[styles.input, { marginBottom: 15 }]} // Added marginBottom to push picker down
         placeholder="Quantity"
         placeholderTextColor="#4A5568"
         keyboardType="numeric"
         value={newItemQuantity}
         onChangeText={(text) => setNewItemQuantity(text.replace(/[^0-9]/g, ''))}
       />
       {/* FIX: Re-introduced a View wrapper for better clipping control */}
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


     {groceries.map((item) => (
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
     ))}


     {groceries.length === 0 && <Text style={styles.empty}>No groceries added yet.</Text>}


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
   marginBottom: 10, // Default marginBottom
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
 // FIX: New style for the Picker's wrapper View
 pickerContainer: {
   backgroundColor: '#fff',
   borderRadius: 8,
   borderWidth: 1,
   borderColor: '#CBD5E0',
   height: 50, // Fixed height for the container
   justifyContent: 'center', // Center content vertically inside the container
   overflow: 'hidden', // IMPORTANT: Force clipping of content that exceeds height
   marginTop: 10, // Space between Quantity input and Picker
   marginBottom: 15, // Space between Picker and Add button
   zIndex: 10, // Ensure it's on top of other elements if overlapping
 },
 // FIX: Styles for the Picker component itself
picker: {
 width: '100%',
 height: '450%',
 backgroundColor: 'transparent',
 fontSize: 16,
 color: '#1A202C',
 paddingVertical: Platform.OS === 'android' ? 2 : 0,
 // @ts-ignore
 textAlignVertical: 'center',
},
 // FIX: Adjust fontSize for items within the dropdown list
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
