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
} from "firebase/firestore";
import { Users, MessageCircle } from "lucide-react";

const User_sidebar = ({ setShowSideBar }) => {
  const [user, setUser] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"
  const { setChatType, selectedUserId, chatType } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const q = query(
      collection(dataBase, "Users"),
      where("visible", "==", true),
      orderBy("userId", "asc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchUsers = snapshot.docs.map((doc) => {
        return {
          UserId: doc.id,
          ...doc.data(),
        };
      });
      setUser(fetchUsers);
    });
    return () => unsubscribe();
  }, []);

  const selectGroup = () => {
    navigate("/chat/defaultPublicGroup");
    setShowSideBar(false);
  };

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
                {user &&
                  user.map((item) => (
                    <User
                      setShowSideBar={setShowSideBar}
                      key={item.UserId}
                      user={item}
                      isActive={
                        location.pathname === `/dm/${item.UserId}`
                      }
                    />
                  ))}
              </div>
            </>
          ) : (
            <GroupsList setShowSideBar={setShowSideBar} />
          )}
        </div>
      </div>
    </div>
  );
};

export default User_sidebar;
