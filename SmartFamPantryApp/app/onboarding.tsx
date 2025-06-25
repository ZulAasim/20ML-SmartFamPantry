// app/onboarding.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';

const OnboardingScreen: React.FC = () => {
  const { user, familyId, loadingAuth, loadingUserData } = useUser();
  const router = useRouter();

  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [isCreatingNewFamily, setIsCreatingNewFamily] = useState(true);
  const [loading, setLoading] = useState(false);

  // useEffect for redirecting based on auth and familyId state
  useEffect(() => {
    // Only proceed with redirects if authentication and user data are fully loaded
    if (!loadingAuth && !loadingUserData) {
      if (!user) {
        // If no user is logged in, and we're not loading, go to login
        console.log("OnboardingScreen useEffect: No user, redirecting to login.");
        router.replace('/auth/LoginScreen');
      } else if (familyId) {
        // If user is logged in AND has a familyId, onboarding is complete, go to tabs
        console.log("OnboardingScreen useEffect: User has familyId, redirecting to tabs.");
        router.replace('/(tabs)');
      }
      // If user is logged in but no familyId, stay on this screen (onboarding is ongoing)
    }
  }, [user, familyId, loadingAuth, loadingUserData, router]);

  // handleFamilyAction useCallback
  const handleFamilyAction = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'No active user found. Please re-login.');
      router.replace('/auth/LoginScreen');
      return;
    }
    setLoading(true);

    try {
      let finalFamilyId = '';
      let targetFamilyDocRef = null;

      if (isCreatingNewFamily) {
        if (!familyName.trim()) {
          Alert.alert('Error', 'Please enter a family name.');
          return;
        }
        finalFamilyId = uuidv4();
        targetFamilyDocRef = doc(db, 'families', finalFamilyId);

        await setDoc(targetFamilyDocRef, {
          familyName: familyName.trim(),
          members: [user.uid],
          createdAt: new Date(),
          adminUid: user.uid,
        });
        console.log('New family document created with ID:', finalFamilyId);

      } else { // Joining existing family
        if (!familyCode.trim()) {
          Alert.alert('Error', 'Please enter a family code.');
          return;
        }
        targetFamilyDocRef = doc(db, 'families', familyCode.trim());
        const familyDocSnap = await getDoc(targetFamilyDocRef);

        if (!familyDocSnap.exists()) {
          Alert.alert('Error', 'Invalid Family Code. Please check and try again.');
          return;
        }
        finalFamilyId = familyDocSnap.id;

        await updateDoc(targetFamilyDocRef, {
          members: arrayUnion(user.uid)
        });
        console.log('Family document updated with new member:', user.uid);
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        familyId: finalFamilyId,
      });
      console.log('User profile updated with familyId:', finalFamilyId);

      Alert.alert('Success', 'Family setup complete! Entering the app...');

    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Family Setup Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user, familyName, familyCode, isCreatingNewFamily, router]); // Added router to dependencies

  // Conditional rendering for loading state
  if (loadingUserData || !user) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
    );
  }

  // Main JSX for the form content
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Setup</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isCreatingNewFamily && styles.toggleButtonActive]}
          onPress={() => { setIsCreatingNewFamily(true); setFamilyCode(''); }}
        >
          <Text style={isCreatingNewFamily ? styles.toggleButtonTextActive : styles.toggleButtonText}>Create New Family</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isCreatingNewFamily && styles.toggleButtonActive]}
          onPress={() => { setIsCreatingNewFamily(false); setFamilyName(''); }}
        >
          <Text style={!isCreatingNewFamily ? styles.toggleButtonTextActive : styles.toggleButtonText}>Join Existing Family</Text>
        </TouchableOpacity>
      </View>

      {isCreatingNewFamily ? (
        <>
          <Text style={styles.inputLabel}>Family Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., The Smith Household"
            value={familyName}
            onChangeText={setFamilyName}
            autoCapitalize="words"
          />
        </>
      ) : (
        <>
          <Text style={styles.inputLabel}>Family Code:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter existing family code"
            value={familyCode}
            onChangeText={setFamilyCode}
            autoCapitalize="none"
          />
        </>
      )}

      <Button title={loading ? "Processing..." : "Continue"} onPress={handleFamilyAction} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#555',
  },
  toggleButtonTextActive: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;