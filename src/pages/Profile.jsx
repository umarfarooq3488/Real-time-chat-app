import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { dataBase } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../config/firebase";
import Navbar from "../layouts/Navbar";

const Profile = () => {
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(dataBase, "Users", userId));
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gray-300 dark:bg-gray-800 h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-xl text-gray-600 dark:text-gray-300">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-300 dark:bg-gray-800 h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-xl text-red-600 dark:text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-300 dark:bg-gray-800 h-screen">
      <Navbar />
      <div className="flex justify-center items-center h-[calc(100vh-80px)] p-4">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mb-6">
              <img
                src={userProfile?.photoURL || "https://via.placeholder.com/100"}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto border-4 border-gray-200 dark:border-gray-600"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {userProfile?.displayName || "Unknown User"}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {userProfile?.email || "No email available"}
            </p>

            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="text-gray-800 dark:text-white font-mono text-sm">
                  {userProfile?.uid || "N/A"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Online
                </span>
              </div>

              {currentUser?.uid === userId && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This is your profile
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 