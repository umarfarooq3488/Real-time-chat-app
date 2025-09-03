import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, dataBase } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "../layouts/Navbar";
import ChatRoom from "../components/ChatRoom";
import User_sidebar from "../components/User/User_sidebar";
import SideIcons from "../components/User/SideIcons";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import { AlertCircle } from "lucide-react";

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [group, setGroup] = useState(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const { isGuest, guestSessionStart, endGuestSession } = useGuest();
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const { setChatType, setSelectedUserId } = useUser();

  useEffect(() => {
    // Set the chat type to group when this component mounts
    setChatType("group");
    setSelectedUserId(groupId);
  }, [groupId, setChatType, setSelectedUserId]);

  // Check if user has access to this group
  useEffect(() => {
    const checkGroupAccess = async () => {
      if (!auth.currentUser || isGuest) {
        setLoading(false);
        return;
      }

      try {
        // Fetch group data
        const groupDoc = await getDoc(doc(dataBase, "groups", groupId));
        if (!groupDoc.exists()) {
          setLoading(false);
          return;
        }

        const groupData = groupDoc.data();
        setGroup(groupData);

        // If group is public, allow access
        if (groupData.visibility === "public") {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // If group is private, check if user is a member
        const userDoc = await getDoc(doc(dataBase, "Users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userJoinedGroups = userData.groupsJoined || [];
          
          if (userJoinedGroups.includes(groupId)) {
            setHasAccess(true);
          } else {
            // Show access denied alert and redirect
            setShowAccessDenied(true);
            setTimeout(() => {
              navigate("/chat", { replace: true });
            }, 2000);
          }
        } else {
          // Show access denied alert and redirect
          setShowAccessDenied(true);
          setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 2000);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error checking group access:", error);
        setLoading(false);
      }
    };

    checkGroupAccess();
  }, [groupId, isGuest, navigate]);

  useEffect(() => {
    if (isGuest) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - guestSessionStart) / 1000);
        const remaining = 3600 - elapsed;
        if (remaining <= 0) {
          endGuestSession();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isGuest, guestSessionStart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Access Denied Alert */}
      {showAccessDenied && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span>
            {group?.visibility === "private" 
              ? "Access denied: This is a private group. You need to be invited to join."
              : "Access denied: You don't have access to this group."
            }
          </span>
        </div>
      )}

      {isGuest && (
        <div className="bg-yellow-100 sm:left-20 left-4 top-[92vh] z-100 absolute lg:left-[40vw] md:top-3 dark:bg-yellow-900 p-2 text-center">
          Guest Session -
          <span className="hidden md:inline-block"> Read Only Mode </span>
          <span className="ml-2">
            Time remaining: {Math.floor(timeRemaining / 60)}:
            {(timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}
      <Navbar />
      <div className="flex bg-gray-300 dark:bg-gray-800 m-0">
        <SideIcons setShowSideBar={setShowSideBar} />
        <div className={`${showSideBar ? "" : "hidden md:block"}`}>
          <User_sidebar setShowSideBar={setShowSideBar} />
        </div>
        <div className="flex-grow">
          <ChatRoom scroll={scrollRef} />
        </div>
      </div>
    </div>
  );
};

export default GroupChat; 