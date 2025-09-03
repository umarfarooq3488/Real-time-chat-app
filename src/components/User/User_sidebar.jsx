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

const User_sidebar = ({ setShowSideBar, onOpenPeople }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUserDoc, setCurrentUserDoc] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab from URL query (?tab=users|groups|requests)
  const searchParams = new URLSearchParams(location.search);
  const initialTab = ["users", "groups", "requests"].includes(searchParams.get("tab"))
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

  const selectGroup = () => {
    navigate("/chat/defaultPublicGroup");
    setShowSideBar(false);
  };

  const connectedUserIds = new Set(currentUserDoc?.connections || []);
  const connectedUsers = allUsers
    .filter((u) => u.userId && u.userId !== auth.currentUser?.uid)
    .filter((u) => connectedUserIds.has(u.userId));

  const incomingCount = (currentUserDoc?.pendingIncoming || []).length;

  return (
    <div className="h-[87vh] z-50 overflow-auto no-scrollbar duration-500 w-[87%] md:w-[20vw] transition-all bg-gray-200 text-gray-600 dark:bg-gray-900 dark:text-gray-100 md:h-[90vh] md:relative absolute">
      <div className="cursor-pointer h-full border-r-4 p-3 border-gray-400">
        <div className="box flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-300 dark:border-gray-600 mb-4">
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

          {/* Content based on active tab */}
          {activeTab === "users" ? (
            <>
              <div className="top text-xl font-bold p-3 flex items-center justify-between">
                <span>Direct Messages</span>
                <button
                  onClick={onOpenPeople}
                  className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  People
                </button>
              </div>
              <div className="users flex flex-col gap-1">
                <div>
                  <div
                    onClick={selectGroup}
                    className={`box overflow-hidden flex gap-3 rounded-md p-4 transition-colors duration-200
                      ${
                        location.pathname.startsWith("/chat/") && !location.pathname.startsWith("/dm/")
                          ? "bg-teal-700 dark:bg-teal-800 text-white"
                          : "dark:hover:bg-gray-600 hover:bg-[#c4c4c4] dark:bg-gray-700 bg-gray-300"
                      }`}
                  >
                    <img src={Groupdp} className="rounded-full w-12" alt="" />
                    <div className="info flex flex-col">
                      <h3
                        className={`font-bold text-lg ${
                          location.pathname.startsWith("/chat/") && !location.pathname.startsWith("/dm/") ? "text-white" : "dark:text-gray-100"
                        }`}
                      >
                        Public Group
                      </h3>
                      <p
                        className={`text-sm text-nowrap ${
                          location.pathname.startsWith("/chat/") && !location.pathname.startsWith("/dm/")
                            ? "text-gray-100"
                            : "dark:text-gray-300"
                        }`}
                      >
                        Anyone can see your messages
                      </p>
                    </div>
                  </div>
                </div>
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
                    You have no connections yet. Click People to find and connect.
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
