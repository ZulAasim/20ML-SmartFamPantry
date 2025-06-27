// // app/_layout.tsx
// import 'react-native-get-random-values';
// import React, { useEffect } from 'react'; 
// import { SplashScreen, Stack, Redirect } from 'expo-router';
// import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
// import { UserProvider, useUser } from '../context/UserContext';

// SplashScreen.preventAutoHideAsync();

// function RootAuthRedirector() {
//   const { user, familyId, loadingAuth, loadingUserData } = useUser(); 
//   useEffect(() => {
//     console.log(`RootAuthRedirector Render: user=${user ? user.uid : 'null'}, familyId=${familyId}, loadingAuth=${loadingAuth}, loadingUserData=${loadingUserData}`);
//   }, [user, familyId, loadingAuth, loadingUserData]);
//   if (loadingAuth || loadingUserData) {
//     console.log("RootAuthRedirector: Loading auth or user data.");
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#3B82F6" />
//         <Text style={styles.loadingText}>
//           {loadingAuth ? 'Checking authentication...' : 'Loading user data...'}
//         </Text>
//       </View>
//     );
//   }
//   SplashScreen.hideAsync();
//   if (user) {
//     if (familyId) {
//       console.log("RootAuthRedirector: User is logged in AND has familyId. Redirecting to (tabs).");
//       return <Redirect href="/(tabs)" />;
//     } else {
//       console.log("RootAuthRedirector: User is logged in but NO familyId. Redirecting to onboarding.");
//       return <Redirect href="/onboarding" />;
//     }
//   } else {
//     console.log("RootAuthRedirector: No user logged in. Redirecting to auth/LoginScreen.");
//     return <Redirect href="/auth/LoginScreen" />;
//   }
// }
// console.log('1. _layout.tsx file has started executing.');
// export default function RootLayout() {
//   return (
//     <UserProvider>
//       <View style={{ flex:1}}>
//       <RootAuthRedirector />
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="auth" options={{ headerShown: false }}/>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
//         <Stack.Screen name="onboarding" options={{ headerShown: false }}/>
//         <Stack.Screen name="+not-found" options={{ headerShown: false }}/>
//       </Stack>
//       </View>
//     </UserProvider>
//   );
// }
// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f8f8',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#555',
//   },
// });


// app/_layout.tsx
import 'react-native-get-random-values'; // Keep this at the very top
import React, { useEffect } from 'react';
import { SplashScreen, Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { UserProvider, useUser } from '../context/UserContext';

// Prevent the splash screen from auto-hiding before our app is ready
SplashScreen.preventAutoHideAsync();

/**
 * RootAuthRedirector handles the initial authentication and user data loading,
 * then renders the appropriate part of the app (auth, onboarding, or main tabs).
 */
function RootAuthRedirector() {
  const { user, familyId, loadingAuth, loadingUserData } = useUser();

  // Log current state for debugging
  useEffect(() => {
    console.log(`RootAuthRedirector Render: user=${user ? user.uid : 'null'}, familyId=${familyId}, loadingAuth=${loadingAuth}, loadingUserData=${loadingUserData}`);
  }, [user, familyId, loadingAuth, loadingUserData]);

  // Show a loading indicator while authentication or user data is being fetched
  if (loadingAuth || loadingUserData) {
    console.log("RootAuthRedirector: Loading auth or user data.");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>
          {loadingAuth ? 'Checking authentication...' : 'Loading user data...'}
        </Text>
      </View>
    );
  }

  // Once loading is complete, hide the splash screen
  SplashScreen.hideAsync();

  // Handle redirection based on authentication and familyId status
  if (user) {
    // User is logged in
    if (familyId) {
      console.log("RootAuthRedirector: User is logged in AND has familyId. Rendering main app (tabs).");
      // If user is logged in AND has a family ID, render the main app (tabs)
      return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          <Stack.Screen name="+not-found" options={{ headerShown: false }}/>
        </Stack>
      );
    } else {
      console.log("RootAuthRedirector: User is logged in but NO familyId. Redirecting to onboarding.");
      // User is logged in but has no family ID, redirect to onboarding
      return <Redirect href="/onboarding" />;
    }
  } else {
    console.log("RootAuthRedirector: No user logged in. Rendering auth stack.");
    // No user logged in, render the authentication stack
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }}/>
        <Stack.Screen name="+not-found" options={{ headerShown: false }}/>
      </Stack>
    );
  }
}

console.log('1. _layout.tsx file has started executing.'); // This log helps confirm file execution

/**
 * RootLayout is the top-level component that wraps the entire app
 * with necessary providers (like UserProvider) and renders the
 * RootAuthRedirector to handle the main navigation logic.
 */
export default function RootLayout() {
  return (
    <UserProvider>
      {/* RootAuthRedirector is now the *sole* child, managing all conditional rendering */}
      <RootAuthRedirector />
    </UserProvider>
  );
}

// Styles for the loading screen
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