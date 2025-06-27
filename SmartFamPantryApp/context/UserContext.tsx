// context/UserContext.tsx

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react'; // Added useCallback
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Ensure correct path to your Firebase config

interface UserContextType {
  user: User | null;
  familyId: string | null;
  loadingAuth: boolean;
  loadingUserData: boolean;
  clearUser: () => void; // <-- ADDED: Type definition for clearUser
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(true);

  // Ref to store unsubscribe function for Firestore listener
  const unsubscribeFirestoreRef = useRef<(() => void) | null>(null);
  const isMounted = useRef(false); // To prevent state updates on unmounted component

  // ADDED: clearUser function
  const clearUser = useCallback(() => {
    console.log("UserContext: clearUser called. Clearing user and familyId states.");
    setUser(null);
    setFamilyId(null);
    // Important: Also unsubscribe from any active Firestore listeners when user logs out/clears
    if (unsubscribeFirestoreRef.current) {
        unsubscribeFirestoreRef.current();
        unsubscribeFirestoreRef.current = null;
        console.log("UserContext: Firestore listener unsubscribed by clearUser.");
    }
  }, []); // No dependencies, so it's stable

  useEffect(() => {
    isMounted.current = true;
    console.log("UserContext: useEffect hook initiated. isMounted.current:", isMounted.current);

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("UserContext: onAuthStateChanged callback FIRED.");
      if (currentUser) {
        console.log(`UserContext: currentUser (from Firebase) is: ${currentUser.email} UID: ${currentUser.uid}`);
        setUser(currentUser);

        // Cleanup previous Firestore listener if any
        if (unsubscribeFirestoreRef.current) {
          console.log("UserContext: Unsubscribing from previous user doc listener.");
          unsubscribeFirestoreRef.current();
          unsubscribeFirestoreRef.current = null; // Clear ref after unsubscribing
        }

        // Set up new Firestore listener for user profile
        setLoadingUserData(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeFirestoreRef.current = onSnapshot(userDocRef, (docSnap) => {
          if (isMounted.current) {
            console.log(`UserContext: Firestore user doc listener fired for UID: ${currentUser.uid}`);
            if (docSnap.exists()) {
              const userData = docSnap.data() as DocumentData;
              const fetchedFamilyId = userData.familyId || null;
              setFamilyId(fetchedFamilyId);
              console.log(`UserContext: Firestore user profile found. Family ID: ${fetchedFamilyId}`);
            } else {
              // User document does not exist, likely a brand new signup before profile is created
              console.log(`UserContext: Firestore user profile NOT found for UID: ${currentUser.uid}. Setting familyId to null.`);
              setFamilyId(null);
            }
            console.log(`UserContext: setLoadingUserData(false) executed after doc listener for ${currentUser.uid}`);
            setLoadingUserData(false); // Ensure this is set to false after receiving data
          }
        }, (error) => {
          console.error("UserContext: Error listening to user document:", error);
          if (isMounted.current) {
            setLoadingUserData(false);
          }
        });

      } else {
        console.log("UserContext: onAuthStateChanged detected NO current user. Setting user to null."); // Added more specific log
        // When there's no current user (logged out), call clearUser to reset states and unsubscribe Firestore
        if (isMounted.current) {
            clearUser(); // <-- Call clearUser here on logout
            setLoadingUserData(false); // Ensure this is set to false even on logout
        }
        console.log("UserContext: User is null. All states cleared."); // Added log
      }
      if (isMounted.current) {
        setLoadingAuth(false);
      }
    });

    return () => {
      isMounted.current = false;
      console.log("UserContext: useEffect cleanup. Unsubscribing auth listener."); // Added log
      unsubscribeAuth();
      if (unsubscribeFirestoreRef.current) {
        console.log("UserContext: useEffect cleanup. Unsubscribing Firestore listener."); // Added log
        unsubscribeFirestoreRef.current();
        unsubscribeFirestoreRef.current = null;
      }
    };
  }, [clearUser]); // Added clearUser to dependency array as it's used inside useEffect

  return (
    <UserContext.Provider value={{ user, familyId, loadingAuth, loadingUserData, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};