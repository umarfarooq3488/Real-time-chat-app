import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import User from "./User";
import SideIcons from "./SideIcons";
import { dataBase } from "../../config/firebase";
import Groupdp from "../../assets/GroupDp.png";
import { useUser } from "../../context/UserContext";
import GroupsList from "../GroupsList";
import {
  collection,
  onSnapshot,
  orderBy,
  limit,
  where,
  query,
  doc,
} from "firebase/firestore";
import { Users, MessageCircle } from "lucide-react";
import { auth } from "@/config/firebase";
import PeopleList from "./PeopleList";
import Requests from "./Requests";

const User_sidebar = ({
  setShowSideBar,
  onOpenPeople = () => console.warn("onOpenPeople not provided"),
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUserDoc, setCurrentUserDoc] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab from URL query (?tab=users|groups|requests)
  const searchParams = new URLSearchParams(location.search);
  const initialTab = ["users", "groups", "requests"].includes(
    searchParams.get("tab")
  )
    ? searchParams.get("tab")
    : "users";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // Keep activeTab in sync if URL changes
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (["users", "groups", "requests"].includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    // Auto-select tab based on current route
    if (location.pathname.startsWith("/chat/")) {
      if (activeTab !== "groups") setActiveTab("groups");
    } else if (location.pathname.startsWith("/dm/")) {
      if (activeTab !== "users") setActiveTab("users");
    }
  }, [location.pathname]);

  useEffect(() => {
    const q = query(
      collection(dataBase, "Users"),
      where("visible", "==", true),
      orderBy("userId", "asc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchUsers = snapshot.docs.map((docSnap) => {
        return {
          UserId: docSnap.id,
          ...docSnap.data(),
        };
      });
      setAllUsers(fetchUsers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const ref = doc(dataBase, "Users", auth.currentUser.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setCurrentUserDoc({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsubscribe();
  }, []);

  const connectedUserIds = new Set(currentUserDoc?.connections || []);
  const connectedUsers = allUsers
    .filter((u) => u.userId && u.userId !== auth.currentUser?.uid)
    .filter((u) => connectedUserIds.has(u.userId));

  return (
    <div
      className="
        h-[87vh] md:h-[90vh] 
        z-50 overflow-hidden
        bg-gray-200 text-gray-600 dark:bg-gray-900 dark:text-gray-100
        absolute md:relative
        transition-all
        w-full sm:w-[50vw] md:w-[28vw] lg:w-[22vw]
      "
    >
      <div className="cursor-pointer h-full border-r border-gray-300 dark:border-gray-700 flex flex-col">
        {/* Tabs - always visible */}
        <div className="sticky top-0 z-20 bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600">
          <div className="flex overflow-x-auto no-scrollbar min-w-[320px]">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                <span>Chats</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                activeTab === "groups"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={16} />
                <span>Groups</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="px-3 flex-1 overflow-y-auto no-scrollbar">
          {activeTab === "users" ? (
            <>
              <div className="top text-xl font-bold md:p-4 flex items-center justify-between">
                <span>Direct Messages</span>
                <button
                  onClick={onOpenPeople}
                  className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  People
                </button>
              </div>
              <div className="users flex flex-col gap-1">
                {connectedUsers &&
                  connectedUsers.map((item) => (
                    <User
                      setShowSideBar={setShowSideBar}
                      key={item.UserId}
                      user={item}
                      isActive={location.pathname === `/dm/${item.UserId}`}
                    />
                  ))}
                {connectedUsers.length === 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-4">
                    You have no connections yet. Click People to find and
                    connect.
                  </div>
                )}
              </div>
            </>
          ) : activeTab === "groups" ? (
            <GroupsList setShowSideBar={setShowSideBar} />
          ) : (
            <Requests currentUser={currentUserDoc} />
          )}
        </div>
      </div>
    </div>
  );
};

export default User_sidebar;
