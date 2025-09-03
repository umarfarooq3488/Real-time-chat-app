// src/context/userVisibilityContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserVisibility, setUserVisibility } from "@/hooks/userVisibility";
import { auth } from "@/config/firebase"; // Still needed for setUserVisibility indirectly

const UserVisibilityContext = createContext();

// Accept 'user' prop from useAuthState
export const UserVisibilityProvider = ({ children, user }) => {
  const [visible, setVisible] = useState(undefined); // undefined means not yet loaded/determined
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetVisibility = async () => {
      if (user) {
        // User is authenticated, fetch their specific visibility
        const v = await getUserVisibility(user.uid); // Pass user.uid here
        setVisible(v);
      } else {
        // User is not authenticated (null from useAuthState).
        // On first render/login, we want to allow messaging.
        // So, if no authenticated user, assume visible for messaging purposes in this context.
        setVisible(true); // Allow by default for unauthenticated users
      }
      setLoading(false);
    };

    fetchAndSetVisibility();
    // Re-run this effect only when the 'user' object from useAuthState changes
  }, [user]); // Dependency on 'user' from useAuthState

  const updateVisibility = async (newVisible) => {
    setVisible(newVisible);
    await setUserVisibility(newVisible);
  };

  return (
    <UserVisibilityContext.Provider value={{ visible, updateVisibility, loading }}>
      {children}
    </UserVisibilityContext.Provider>
  );
};

export const useUserVisibility = () => useContext(UserVisibilityContext);
