import React from "react";
import { auth, dataBase } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";

const SaveUserData = () => {
  const { uid, displayName, photoURL } = auth.currentUser;

  // Save user data with custom document ID (uid)
  (async function SaveData() {
    try {
      // Use uid as the document ID
      const userDocRef = doc(dataBase, "Users", uid);

      // Save the user data (renamed uid field)
      await setDoc(userDocRef, {
        userId: uid, // Renamed field
        displayName: displayName,
        photoUrl: photoURL,
      });

      console.log("User data successfully saved with UID as document ID:");
    } catch (error) {
      console.error("Error saving user data:", error.message);
    }
  })();
};

export default SaveUserData;