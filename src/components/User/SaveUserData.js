import React, { useEffect } from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
// import OneSignal from "react-onesignal";

const SaveUserData = ({ onSaveComplete }) => {
  useEffect(() => {
    const saveUserData = async () => {
      try {
        // Get current user data from Firebase auth
        const { uid, displayName, photoURL, email } = auth.currentUser;

        if (!uid) {
          console.error("User not authenticated");
          return;
        }

        // Use uid as the document ID
        const userDocRef = doc(dataBase, "Users", uid);

        console.log(email)

        // Check if user document already exists
        const existingUserDoc = await getDoc(userDocRef);

        if (existingUserDoc.exists()) {
          // User document exists, only update lastSeen and preserve existing data
          await setDoc(userDocRef, {
            lastSeen: new Date()
          }, { merge: true });
        } else {
          // User document doesn't exist, create it with initial data
          const userData = {
            userId: uid,
            email: email,
            displayName: displayName,
            photoUrl: photoURL,
            visible: true,
            // New fields for user management
            groupsJoined: [], // groups the user is part of
            connections: [], // accepted friends/peers
            pendingIncoming: [], // requests waiting for this user's approval
            pendingOutgoing: [], // requests this user has sent
            createdAt: new Date(),
            lastSeen: new Date()
          };

          // Save user data first
          await setDoc(userDocRef, userData);
        }

        // Call the completion callback
        if (onSaveComplete) {
          onSaveComplete(true);
        }

        // Now try to initialize OneSignal after saving user data
      } catch (error) {
        console.error("Error saving user data:", error);
        if (onSaveComplete) {
          onSaveComplete(false);
        }
      }
    }

    saveUserData();
  }, [onSaveComplete]);

  return null; // No need to render anything
};

export default SaveUserData;
