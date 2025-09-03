import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, dataBase } from "../config/firebase";
import { useGuest } from "../context/GuestUserContext";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { addUserToGroup } from "../lib/groupUtils";

const AuthRedirect = () => {
  const [user, loading] = useAuthState(auth);
  const { isGuest } = useGuest();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and we're on the welcome page, handle redirects
    if (!loading && (user || isGuest)) {
      // Check if there's a pending group invitation
      const pendingGroupId = localStorage.getItem('pendingGroupInvitation');
      if (pendingGroupId && user) {
        // Process the pending invitation
        const processPendingInvitation = async () => {
          try {
            // Remove the pending invitation from localStorage
            localStorage.removeItem('pendingGroupInvitation');
            
            // Fetch the group data
            const groupDoc = await getDoc(doc(dataBase, "groups", pendingGroupId));
            if (groupDoc.exists()) {
              const groupData = { id: groupDoc.id, ...groupDoc.data() };
              
              // Join the group using the utility function
              await addUserToGroup(pendingGroupId, user.uid, "member");
              
              // Navigate to the group
              navigate(`/chat/${pendingGroupId}`, { replace: true });
              return; // Exit early to prevent other redirects
            }
          } catch (error) {
            console.error("Error processing pending invitation:", error);
            // If there's an error, remove the pending invitation and redirect to chat
            localStorage.removeItem('pendingGroupInvitation');
          }
        };
        
        processPendingInvitation();
        return; // Exit early to prevent other redirects
      }
      
      // If no pending invitation, redirect to chat as normal
      navigate("/chat", { replace: true });
    }
  }, [user, isGuest, loading, navigate]);

  // This component doesn't render anything
  return null;
};

export default AuthRedirect; 