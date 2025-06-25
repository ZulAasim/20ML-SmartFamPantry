// app/auth/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack>
      {/* These are the screens within the /auth group */}
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="SignupScreen" options={{ headerShown: false }} />
    </Stack>
  );
}