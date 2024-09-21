import { doc, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";  // Import signOut function
import { dataBase, auth } from "@/config/firebase";  // Import your auth instance

export const deleteUserByUID = async (uid) => {
    try {
        // Reference to the document using uid
        const docRef = doc(dataBase, "Users", uid);

        // Delete the document
        await deleteDoc(docRef);
        console.log("User document successfully deleted with UID:");
        await signOut(auth);
        console.log("User successfully logged out.");
    } catch (error) {
        console.error("Error deleting user:", error.message);
    }
};
