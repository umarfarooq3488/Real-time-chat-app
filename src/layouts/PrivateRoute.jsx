import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import { useGuest } from "../context/GuestUserContext";

const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { isGuest } = useGuest();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="bg-gray-300 dark:bg-gray-800 h-screen flex justify-center items-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  // Redirect to welcome page if not authenticated
  if (!user && !isGuest) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  return children;
};

export default PrivateRoute; 