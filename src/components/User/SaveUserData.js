import React, { useEffect } from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import OneSignal from "react-onesignal";

const SaveUserData = ({ onSaveComplete }) => {
  useEffect(() => {
    const saveUserData = async () => {
      try {
        // Initialize OneSignal
        console.log("Before initializing OneSignal");
        const initResponse = await OneSignal.init({
          appId: "01163343-b315-4598-a898-5cbd1e421eac",
          safari_web_id: "web.onesignal.auto.064b44a8-1dd7-4e10-9d87-452ef5b9c9dd",
          notifyButton: { enable: true },
        });

        console.log("OneSignal initialized with response:", initResponse);

        // Wait for Player ID to be generated (retry if null)
        let playerId = await OneSignal.getUserId();
        let retryCount = 0;
        while (!playerId && retryCount < 5) {
          console.log("Waiting for Player ID... Retry count:", retryCount);
          await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second
          playerId = await OneSignal.getUserId();
          retryCount++;
        }

        if (!playerId) {
          console.error("Player ID is still null after retries");
          return;
        }

        console.log("Player ID received:", playerId);

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

        console.log("User data successfully saved with UID as document ID:", uid);

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
