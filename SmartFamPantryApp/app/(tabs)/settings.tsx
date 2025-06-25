// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, ScrollView // Added ScrollView
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import getDoc

export default function SettingsScreen() {
  const { user, familyId, loadingAuth, loadingUserData, clearUser } = useUser();
  const [currentLowStockThreshold, setCurrentLowStockThreshold] = useState<string>('');
  const [loadingSetting, setLoadingSetting] = useState(true);

  // --- Fetch Low Stock Threshold on Load ---
  useEffect(() => {
    const fetchThreshold = async () => {
      if (familyId) {
        try {
          setLoadingSetting(true);
          const familyRef = doc(db, 'families', familyId);
          const docSnap = await getDoc(familyRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Check if lowStockThreshold exists, otherwise default to a number like 5
            setCurrentLowStockThreshold((data.lowStockThreshold || 5).toString());
          } else {
            // Default if family document doesn't exist or no threshold is set
            setCurrentLowStockThreshold('5');
          }
        } catch (error: any) {
          console.error("Error fetching low stock threshold:", error);
          Alert.alert("Error", "Could not fetch low stock threshold: " + error.message);
          setCurrentLowStockThreshold('5'); // Fallback to default
        } finally {
          setLoadingSetting(false);
        }
      } else {
        setLoadingSetting(false); // No familyId, so no threshold to fetch
        setCurrentLowStockThreshold('5'); // Default if no family
      }
    };
    fetchThreshold();
  }, [familyId]);

  // --- Handle Logout ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser(); // Clear user context
      Alert.alert("Logged Out", "You have been successfully logged out.");
      // Expo Router automatically handles navigation to the auth stack after clearUser
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  // --- Handle Leave Family ---
  const handleLeaveFamily = async () => {
    if (!user || !familyId) {
      Alert.alert("Error", "You are not part of a family or not logged in.");
      return;
    }

    Alert.alert(
      "Confirm Leave Family",
      "Are you sure you want to leave this family? You will need to join or create a new family.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Leave",
          onPress: async () => {
            try {
              // Optionally, remove user from family's member list (more complex)
              // For simplicity now, just log them out and clear familyId
              await signOut(auth); // Log out user from Firebase
              clearUser(); // Clear user context, including familyId
              Alert.alert("Family Left", "You have successfully left the family.");
              // User will be redirected to the family join/create screen via UserContext logic
            } catch (error: any) {
              Alert.alert("Error Leaving Family", error.message);
            }
          },
        },
      ]
    );
  };

  // --- Handle Update Low Stock Threshold ---
  const handleUpdateLowStockThreshold = async () => {
    if (!familyId) {
      Alert.alert("Error", "No family selected to update threshold.");
      return;
    }
    const newThreshold = parseInt(currentLowStockThreshold, 10);
    if (isNaN(newThreshold) || newThreshold < 0) {
      Alert.alert("Invalid Input", "Please enter a valid non-negative number for the threshold.");
      return;
    }

    try {
      setLoadingSetting(true); // Indicate loading for this specific action
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        lowStockThreshold: newThreshold,
      });
      Alert.alert("Success", "Low stock threshold updated!");
    } catch (error: any) {
      console.error("Error updating low stock threshold:", error);
      Alert.alert("Error", "Failed to update low stock threshold: " + error.message);
    } finally {
      setLoadingSetting(false);
    }
  };

  if (loadingAuth || loadingUserData || loadingSetting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>⚙️ Settings</Text>

        {/* Family ID Section */}
        {familyId && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Current Family</Text>
            <Text style={styles.settingText}>
              Family ID: <Text style={styles.highlightText}>{familyId}</Text>
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleLeaveFamily}>
              <Text style={styles.buttonText}>Leave Family</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Low Stock Threshold Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Inventory Alerts</Text>
          <Text style={styles.settingText}>
            Set the quantity below which an item is considered low stock.
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={currentLowStockThreshold}
              onChangeText={text => setCurrentLowStockThreshold(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="e.g., 5"
              placeholderTextColor="#A0AEC0"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateLowStockThreshold}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account Actions</Text>
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F7FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A5568',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#EDF2F7',
    padding: 18,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E0',
    paddingBottom: 8,
  },
  settingText: {
    fontSize: 15,
    color: '#4A5568',
    marginBottom: 10,
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#3182CE',
  },
  button: {
    backgroundColor: '#3182CE',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#E53E3E', // Red for logout
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#48BB78', // Green for save
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});