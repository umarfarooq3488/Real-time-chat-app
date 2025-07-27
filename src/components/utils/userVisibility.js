import { doc, updateDoc, getDoc } from "firebase/firestore";
import { dataBase } from "@/config/firebase"; // adjust path if needed
import { auth } from "@/config/firebase"; // adjust path if needed

export async function setUserVisibility(isVisible) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(dataBase, "Users", user.uid);
    try {
        await updateDoc(userRef, { visible: isVisible });
        console.log("Visibility updated successfully")
    } catch (error) {
        console.error("Failed to update visibility:", error);
    }
}

export async function getUserVisibility(uid) {
    if (!uid) {
        // If no UID is provided, it means either no user is logged in
        // or auth state is not yet resolved. In this case, allow messaging by default.
        return true;
    }
    const userRef = doc(dataBase, "Users", uid);
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            // Return the actual visible status from Firestore
            return userSnap.data().visible;
        }
        // User document not found, assume visible (or handle as a special case if needed)
        return true; // Default to true if user document doesn't exist
    } catch (error) {
        console.error("Failed to fetch visibility:", error);
        return true; // In case of error, allow by default
    }
}
