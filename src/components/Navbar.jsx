import React, { useEffect } from "react";
import GoogleImg from "./Google.png";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import icons

// importing custom hook for theme;
import ThemeBtn from "./ThemeBtn";
// Navigation Bar Component
const Navbar = () => {
  const [user] = useAuthState(auth);

  const GoogleSignIn = () => {
    const googleProvider = new GoogleAuthProvider();
    signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    auth.signOut();
  };

  return (
    <div>
      <nav className="flex justify-between items-center p-3 bg-gray-300 dark:bg-gray-800 shadow-lg text-black dark:text-white">
        {/* Logo Section */}
        <div className="logo">
          <a
            href="#"
            className="text-2xl font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition duration-300"
          >
            LinkLine
          </a>
        </div>

        <div className="flex gap-2 md:gap-6 items-center">
          <ThemeBtn />

          {/* Login Section */}
          <div className="login flex items-center space-x-4">
            {!user ? (
              <button
                onClick={GoogleSignIn}
                className="flex items-center text-lg px-4 py-2 bg-teal-500 hover:bg-teal-600 text-black rounded-lg transition duration-300 shadow-md"
              >
                <span className="mr-2 text-sm sm:text-lg">
                  Login with Google
                </span>
                <img
                  src={GoogleImg}
                  className="w-6 rounded-md"
                  alt="Google Icon"
                />
              </button>
            ) : (
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 border-teal-600 border-2 hover:bg-teal-600 text-black dark:text-white rounded-lg transition duration-300 shadow-md"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
