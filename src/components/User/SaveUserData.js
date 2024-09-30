import React, { useEffect } from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import OneSignal from "react-onesignal";

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
          oneSignalPlayerId: null, // Initially set to null
        };

        // Save user data first
        await setDoc(userDocRef, userData);
        console.log("User data saved with UID as document ID:", uid);

        // Now try to initialize OneSignal after saving user data
        try {
          console.log("Initializing OneSignal...");
          await OneSignal.init({
            appId: "01163343-b315-4598-a898-5cbd1e421eac",
            safari_web_id: "web.onesignal.auto.064b44a8-1dd7-4e10-9d87-452ef5b9c9dd",
            notifyButton: { enable: true },
          });

          // Fetch the OneSignal Player ID
          let playerId = await OneSignal.getUserId();
          let retryCount = 0;

          while (!playerId && retryCount < 5) {
            console.log("Waiting for Player ID... Retry count:", retryCount);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second
            playerId = await OneSignal.getUserId();
            retryCount++;
          }

          if (playerId) {
            // Update the user's OneSignal player ID in Firebase
            await setDoc(
              userDocRef,
              { oneSignalPlayerId: playerId },
              { merge: true }
            );
            console.log("OneSignal Player ID saved:", playerId);
          } else {
            console.warn("Player ID not available after retries");
          }
        } catch (oneSignalError) {
          console.warn("OneSignal initialization failed:", oneSignalError);
        }

        // Notify that saving is complete
        onSaveComplete && onSaveComplete(true);

      } catch (error) {
        console.error("Error saving user data:", error.message);
        onSaveComplete && onSaveComplete(false);
      }
    };

    saveUserData();
  }, [onSaveComplete]);

  return null; // No need to render anything
};

export default SaveUserData;
