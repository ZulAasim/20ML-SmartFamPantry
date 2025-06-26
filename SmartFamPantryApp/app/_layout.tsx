// app/_layout.tsx
import 'react-native-get-random-values';
import React, { useEffect } from 'react'; // Ensure useEffect is imported
import { SplashScreen, Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { UserProvider, useUser } from '../context/UserContext';

// Keep the splash screen visible until the authentication state is determined
SplashScreen.preventAutoHideAsync();

function RootAuthRedirector() {
  const { user, familyId, loadingAuth, loadingUserData } = useUser(); // Get familyId from context

  // NEW: Log user and familyId whenever RootAuthRedirector re-renders
  useEffect(() => {
    console.log(`RootAuthRedirector Render: user=${user ? user.uid : 'null'}, familyId=${familyId}, loadingAuth=${loadingAuth}, loadingUserData=${loadingUserData}`);
  }, [user, familyId, loadingAuth, loadingUserData]);

  // Show a loading screen while authentication status or user data is being fetched
  // Keep the loading state true until BOTH auth and user data (including familyId check) are complete.
  if (loadingAuth || loadingUserData) {
    console.log("RootAuthRedirector: Loading auth or user data."); // Added log
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {loadingAuth ? 'Checking authentication...' : 'Loading user data...'}
        </Text>
      </View>
    );
  }

  // Once loading is complete, hide splash screen
  SplashScreen.hideAsync();

  // Primary redirect logic:
  if (user) {
    // User is logged in. Now, check if they have a familyId.
    if (familyId) {
      console.log("RootAuthRedirector: User is logged in AND has familyId. Redirecting to (tabs).");
      return <Redirect href="/(tabs)" />;
    } else {
      // User is logged in but does NOT have a familyId.
      // This is for newly signed-up users who need to set up/join a family.
      console.log("RootAuthRedirector: User is logged in but NO familyId. Redirecting to onboarding.");
      return <Redirect href="/onboarding" />; // Redirect to an onboarding screen
    }
  } else {
    // No user logged in.
    console.log("RootAuthRedirector: No user logged in. Redirecting to auth/LoginScreen.");
    return <Redirect href="/auth/LoginScreen" />;
  }
}

export default function RootLayout() {
  return (
    <UserProvider>
      <View style={{ flex:1}}>
      <RootAuthRedirector />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
        <Stack.Screen name="onboarding" options={{ headerShown: false }}/>
        <Stack.Screen name="+not-found" options={{ headerShown: false }}/>
      </Stack>
      </View>
    </UserProvider>
  );
}
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
});