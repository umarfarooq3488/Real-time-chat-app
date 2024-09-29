import React, { useEffect } from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import OneSignal from "react-onesignal";

const SaveUserData = ({ onSaveComplete }) => {
  useEffect(() => {
    const saveUserData = async () => {
      try {
        // Initialize OneSignal and ensure it's successful
        console.log("Before OneSignal initialization");
        const initResponse = await OneSignal.init({
          appId: "01163343-b315-4598-a898-5cbd1e421eac", // Your OneSignal App ID
          safari_web_id:
            "web.onesignal.auto.064b44a8-1dd7-4e10-9d87-452ef5b9c9dd",
          notifyButton: { enable: true },
        });

        console.log("OneSignal initialized successfully:", initResponse);

        // Wait for the OneSignal playerId to be available
        let playerId = await OneSignal.getUserId();
        let attempts = 0;

        // Retry until playerId is obtained (max 5 retries)
        while (!playerId && attempts < 5) {
          console.log("Waiting for playerId...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          playerId = await OneSignal.getUserId();
          attempts++;
        }

        if (!playerId) {
          console.error("Failed to retrieve OneSignal playerId after retries");
          return;
        }

        console.log("Player ID obtained:", playerId);

        // Get current user data from Firebase auth
        const { uid, displayName, photoURL } = auth.currentUser;

        // Use uid as the document ID
        const userDocRef = doc(dataBase, "Users", uid);

        // Save the user data along with the OneSignal player ID
        await setDoc(userDocRef, {
          userId: uid,
          displayName: displayName,
          photoUrl: photoURL,
          oneSignalPlayerId: playerId,
        });

        console.log("User data successfully saved with UID:", uid);

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
