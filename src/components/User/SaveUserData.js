import React, { useEffect } from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";
// import OneSignal from "react-onesignal";

const SaveUserData = ({ onSaveComplete }) => {
  useEffect(() => {
    const saveUserData = async () => {
      try {
        // Get current user data from Firebase auth
        const { uid, displayName, photoURL } = auth.currentUser;

        if (!uid) {
          console.error("User not authenticated");
          return;
        }

        // Use uid as the document ID
        const userDocRef = doc(dataBase, "Users", uid);

        // Start saving user data in Firebase without waiting for OneSignal
        const userData = {
          userId: uid,
          displayName: displayName,
          photoUrl: photoURL,
          visible: true
        };

        // Save user data first
        await setDoc(userDocRef, userData);

        // Now try to initialize OneSignal after saving user data
      } catch (error) {
        console.error("Error saving user data:", error);

      }
    }

    saveUserData();
  }, [onSaveComplete]);

  return null; // No need to render anything
};

export default SaveUserData;
