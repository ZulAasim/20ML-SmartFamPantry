import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../../firebaseConfig.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state for button
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true); // Set loading true
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No Alert.alert('Success', 'Logged in successfully!'); needed here anymore.
      // The UserProvider in _layout.tsx will detect the login and fetch user data,
      // then the router will transition automatically.
      console.log('Login successful via Firebase Auth.'); // ADD THIS LINE
      router.replace('../(tabs)/'); // Redirect to the main app tabs
      console.log('Login: Redirected to ../(tabs)/'); // ADD THIS LINE
    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Login Error:', error.message);
    } finally {
      setLoading(false); // Set loading false
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

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
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title={loading ? "Logging In..." : "Login"} onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />}

      <View style={styles.signupPrompt}>
        <Text>Don't have an account?</Text>
        <Button title="Sign Up" onPress={() => router.navigate('/auth/SignupScreen')} />
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
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default LoginScreen;