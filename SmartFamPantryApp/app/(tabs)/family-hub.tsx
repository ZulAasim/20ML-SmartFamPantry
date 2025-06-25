import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Share, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';


const FamilyHubScreen: React.FC = () => {
 const router = useRouter();
 const { user, familyId, loadingAuth, loadingUserData } = useUser();


 const [memberEmails, setMemberEmails] = useState<string[] | null>(null);
 const [loadingMembers, setLoadingMembers] = useState(false);


 // Fetch family members emails by UID
 useEffect(() => {
   const fetchFamilyMembersEmails = async () => {
     if (!familyId) {
       setMemberEmails(null);
       return;
     }
     setLoadingMembers(true);
     try {
       const familyDocRef = doc(db, 'families', familyId);
       const familyDocSnap = await getDoc(familyDocRef);


       if (!familyDocSnap.exists()) {
         setMemberEmails([]);
         return;
       }


       const data = familyDocSnap.data();
       const members: string[] = data.members || [];


       const emails: string[] = [];
       for (const uid of members) {
         const userDocRef = doc(db, 'users', uid);
         const userDocSnap = await getDoc(userDocRef);
         if (userDocSnap.exists()) {
           const userData = userDocSnap.data();
           if (userData.email) emails.push(userData.email);
         }
       }


       setMemberEmails(emails);
     } catch (error) {
       Alert.alert('Error', 'Failed to load family members.');
       setMemberEmails([]);
     } finally {
       setLoadingMembers(false);
     }
   };


   fetchFamilyMembersEmails();
 }, [familyId]);


 const handleLogout = async () => {
   try {
     await auth.signOut();
     router.replace('/');
   } catch (error: any) {
     Alert.alert('Logout Error', error.message);
   }
 };


 const handleShareFamilyCode = async () => {
   if (familyId) {
     try {
       await Share.share({
         message: `Join our family on SmartFamPantry! Use this Family Code to join: ${familyId}`,
         url: 'https://your-app-website.com',
       });
     } catch (error: any) {
       Alert.alert('Share Error', error.message);
     }
   } else {
     Alert.alert('No Family Code', 'You need to be part of a family to share a code.');
   }
 };


 if (loadingAuth || loadingUserData || loadingMembers) {
   return (
     <View style={styles.container}>
       <ActivityIndicator size="large" color="#3B82F6" />
       <Text style={{ marginTop: 10 }}>Loading family data...</Text>
     </View>
   );
 }


 return (
   <ScrollView contentContainerStyle={styles.container}>
     <Text style={styles.title}>Family Hub</Text>
     {user ? (
       <>
         <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>


         {familyId ? (
           <View style={styles.familyInfoContainer}>
             <Text style={styles.familyCodeLabel}>Your Family ID:</Text>
             <Text selectable style={styles.familyCodeText}>
               {familyId}
             </Text>
             <Button title="Share Family Code" onPress={handleShareFamilyCode} />
             <Text style={styles.instructionText}>
               Share this code with family members who want to join your group during signup.
             </Text>


             <Text style={[styles.subsubtitle, { marginTop: 20 }]}>Family Members:</Text>
             {memberEmails && memberEmails.length > 0 ? (
               memberEmails.map((email, idx) => (
                 <Text key={idx} style={styles.member}>
                   • {email}
                 </Text>
               ))
             ) : (
               <Text style={styles.noFamilyText}>No members found.</Text>
             )}
           </View>
         ) : (
           <Text style={styles.noFamilyText}>
             You are not currently associated with a family. If you just signed up, ensure you created or joined a family.
             If this is an error, please contact support.
           </Text>
         )}


         <View style={{ marginTop: 20 }}>
           <Button title="Logout" onPress={handleLogout} color="#FF6347" />
         </View>
       </>
     ) : (
       <Text>Please log in to access the Family Hub.</Text>
     )}
   </ScrollView>
 );
};


const styles = StyleSheet.create({
 container: {
   flexGrow: 1,
   justifyContent: 'center',
   alignItems: 'center',
   padding: 20,
   backgroundColor: '#f8f8f8',
 },
 title: {
   fontSize: 28,
   fontWeight: 'bold',
   marginBottom: 30,
   color: '#333',
 },
 welcomeText: {
   fontSize: 18,
   marginBottom: 20,
   color: '#555',
   textAlign: 'center',
 },
 familyInfoContainer: {
   backgroundColor: '#fff',
   padding: 20,
   borderRadius: 10,
   borderWidth: 1,
   borderColor: '#ddd',
   alignItems: 'center',
   width: '100%',
   maxWidth: 320,
 },
 familyCodeLabel: {
   fontSize: 16,
   color: '#777',
   marginBottom: 5,
 },
 familyCodeText: {
   fontSize: 20,
   fontWeight: 'bold',
   color: '#3B82F6',
   marginBottom: 15,
   textAlign: 'center',
 },
 instructionText: {
   fontSize: 14,
   color: '#888',
   marginTop: 10,
   textAlign: 'center',
 },
 subsubtitle: {
   fontSize: 16,
   fontWeight: 'bold',
   color: '#2D3748',
   marginTop: 10,
 },
 member: {
   fontSize: 14,
   color: '#2C5282',
   marginTop: 2,
 },
 noFamilyText: {
   fontSize: 16,
   color: 'red',
   textAlign: 'center',
   marginTop: 10,
 },
});


export default FamilyHubScreen;
