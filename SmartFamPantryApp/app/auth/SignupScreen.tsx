// app/auth/SignupScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth, db } from '../../firebaseConfig.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Only setDoc for initial user profile (without familyId)
import { useRouter } from 'expo-router';

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = useCallback(async () => {
    setLoading(true);

    try {
      if (!email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password should be at least 6 characters long.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const signedUpUser = userCredential.user;
      console.log('Signup successful. Firebase Auth UID:', signedUpUser.uid);

      // Create initial user profile document in Firestore, but WITHOUT familyId yet.
      // The onboarding screen will handle setting the familyId.
      const userDocRef = doc(db, 'users', signedUpUser.uid);
      await setDoc(userDocRef, {
        uid: signedUpUser.uid,
        email: signedUpUser.email,
        // familyId: null or undefined initially, will be set by onboarding
        createdAt: new Date(),
      }, { merge: true }); // Use merge: true just in case, though setDoc would overwrite

      console.log('Initial user profile created in Firestore for UID:', signedUpUser.uid);

      Alert.alert('Success', 'Account created successfully! Now set up your family.');
      // No explicit router.replace here. RootAuthRedirector will handle
      // redirecting to /onboarding because familyId will be null initially.

    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Signup Error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <Text style={styles.inputLabel}>Email:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.inputLabel}>Password:</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password (min 6 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.inputLabel}>Confirm Password:</Text>
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Button title={loading ? "Creating Account..." : "Sign Up"} onPress={handleSignup} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />}

      <View style={styles.loginPrompt}>
        <Text>Already have an account?</Text>
        <Button title="Login" onPress={() => router.replace('/auth/LoginScreen')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default SignupScreen;