// // app/(tabs)/index.tsx
// import { View, Text, StyleSheet } from 'react-native';
// import { useUser } from '../../context/UserContext'; // Ensure this path is correct for your UserContext

// export default function IndexScreen() {
//   const { user, familyId } = useUser(); // Get user details
//   console.log(`IndexScreen: Rendered. User: ${user ? user.email : 'null'}, FamilyID: ${familyId}`); // Add this log

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to the App!</Text>
//       {user && <Text>Logged in as: {user.email}</Text>}
//       {familyId && <Text>Family ID: {familyId}</Text>}
//       <Text style={styles.subtitle}>If you see this, the redirect to tabs worked!</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   subtitle: {
//     marginTop: 10,
//     fontSize: 16,
//     color: 'green',
//   }
// });

// app/index.tsx
import { View, Text, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

const healthTips = [
  "🥗 Eat a variety of fruits and vegetables daily.",
  "💧 Stay hydrated—drink at least 8 cups of water a day.",
  "🚶‍♀️ Take a 30-minute walk every day for heart health.",
  "🧂 Limit salt intake to reduce blood pressure risk.",
  "🍳 Include protein-rich foods in your meals for muscle strength.",
  "🥜 Snack on nuts or seeds for healthy fats.",
  "🧘‍♂️ Practice mindfulness or meditation to reduce stress.",
  "🍵 Try herbal teas for relaxation and digestion."
];

export default function Index() {
  const [randomTip, setRandomTip] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * healthTips.length);
    setRandomTip(healthTips[randomIndex]);
  }, []);

  return (
    <Animated.View entering={FadeInUp} style={styles.container}>
      <Image
        source={require('../../assets/images/mainlogo.jpg')}
        style={styles.banner}
        resizeMode="contain"
      />

      <Text style={styles.title}>Welcome to SmartFam Pantry!</Text>
      <Text style={styles.tipTitle}>🌿 Health & Nutrition Tip</Text>
      <Text style={styles.tipText}>{randomTip}</Text>

      <Link href="/inventory" style={styles.link}>📦 Go to Inventory</Link>
      <Link href="/grocery-list" style={styles.link}>🛒 Go to Grocery List</Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  banner: {
    width: 250,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C5282',
    textAlign: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 18,
    color: '#2D3748',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    color: '#38B2AC',
    marginTop: 20,
    textDecorationLine: 'underline',
  },
});