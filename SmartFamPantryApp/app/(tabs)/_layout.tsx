// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

export default function TabLayout() { // Default export is crucial!
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6', // Tailwind blue-500
          tabBarInactiveTintColor: 'gray',
          headerShown: true, // Show a header for each tab screen
          headerStyle: {
            backgroundColor: '#f8f8f8', // Light background for header
          },
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="index" // Links to app/(tabs)/index.tsx
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory" // Links to app/(tabs)/inventory.tsx
          options={{
            title: 'Inventory',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="grocery-list" // Links to app/(tabs)/grocery-list.tsx
          options={{
            title: 'Grocery List',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="family-hub" // Links to app/(tabs)/family-hub.tsx
          options={{
            title: 'Family Hub',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings" // Links to app/(tabs)/settings.tsx
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore" // Links to app/(tabs)/explore.tsx
          options={{
            href: null, // This hides it from the tab bar but keeps it as a route
            headerShown: false, // Don't show header for this hidden route
          }}
        />
      </Tabs>
    </>
  );
}


// // app/(tabs)/_layout.tsx
// import { Tabs } from 'expo-router';
// import { Text, View } from 'react-native';

// export default function TabLayout() {
//   console.log("TabLayout: Rendered."); // Add this log
//   return (
//     <Tabs>
//       <Tabs.Screen
//         name="index" // This refers to app/(tabs)/index.tsx
//         options={{
//           title: 'Home Test',
//           tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>, // Simple emoji icon
//           headerShown: false, // Ensure no header complexities
//         }}
//       />
//       {/* IMPORTANT: COMMENT OUT ALL OTHER <Tabs.Screen> COMPONENTS FOR THIS TEST */}
//       {/* For example, if you had:
//       <Tabs.Screen name="settings" options={{...}} />
//       <Tabs.Screen name="profile" options={{...}} />
//       ...comment them all out except 'index' for this test.
//       */}
//     </Tabs>
//   );
// }