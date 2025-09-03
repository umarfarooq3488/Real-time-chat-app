import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { dataBase, auth } from "../config/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { Users, Lock, Globe, Calendar, Plus, Share2, AlertCircle } from "lucide-react";
import CreateGroup from "./CreateGroup";
import { GroupInvite } from "./GroupInvite";
import { getActualMemberCount } from "../lib/groupUtils";

const GroupsList = ({ setShowSideBar }) => {
  const [groups, setGroups] = useState([]);
  const [userJoinedGroups, setUserJoinedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user's joined groups
  useEffect(() => {
    const fetchUserJoinedGroups = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(dataBase, "Users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserJoinedGroups(userData.groupsJoined || []);
          }
        } catch (error) {
          console.error("Error fetching user's joined groups:", error);
        }
      }
    };

    fetchUserJoinedGroups();
  }, []);

  useEffect(() => {
    const q = query(
      collection(dataBase, "groups"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchGroups = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(fetchGroups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selectGroup = (groupId) => {
    // Find the group to check if it's private
    const selectedGroup = groups.find(group => group.id === groupId);
    
    // If group is private, check if user is a member
    if (selectedGroup && selectedGroup.visibility === "private") {
      if (!userJoinedGroups.includes(groupId)) {
        setErrorMessage("You need to join this private group first to access it.");
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        return;
      }
    }
    
    // Allow access if it's public or user is a member of private group
    navigate(`/chat/${groupId}`);
    setShowSideBar(false);
  };

  const handleInviteClick = (e, groupId) => {
    e.stopPropagation(); // Prevent group selection
    setSelectedGroupId(groupId);
    setShowInviteModal(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-[87vh] z-50 overflow-auto no-scrollbar duration-500 w-[87%] md:w-[20vw] transition-all bg-gray-200 text-gray-600 dark:bg-gray-900 dark:text-gray-100 md:h-[90vh] md:relative absolute">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      <div className="h-[87vh] z-50 overflow-auto no-scrollbar duration-500 w-[87%] md:w-[20vw] transition-all bg-gray-200 text-gray-600 dark:bg-gray-900 dark:text-gray-100 md:h-[90vh] md:relative absolute">
        <div className="cursor-pointer h-full border-r-4 p-3 border-gray-400">
          <div className="box flex flex-col">
            {/* Header with Create Group Button */}
            <div className="top text-xl font-bold p-3 flex items-center justify-between">
              <span>Groups</span>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                title="Create New Group"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {/* Groups List */}
            <div className="groups flex flex-col gap-2">
              {groups.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Groups Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Create your first group to start collaborating with others!
                    </p>
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      Create Group
                    </button>
                  </div>
                </div>
              ) : (
                groups.map((group) => {
                  const isUserMember = userJoinedGroups.includes(group.id);
                  const isPrivateAndNotMember = group.visibility === "private" && !isUserMember;
                  
                  return (
                    <div
                      key={group.id}
                      onClick={() => selectGroup(group.id)}
                      className={`box overflow-hidden flex gap-3 rounded-md p-4 transition-colors duration-200 cursor-pointer relative group
                        ${
                          location.pathname === `/chat/${group.id}`
                            ? "bg-teal-700 dark:bg-teal-800 text-white"
                            : isPrivateAndNotMember
                            ? "dark:hover:bg-red-600 hover:bg-red-400 dark:bg-red-700 bg-red-300 opacity-75"
                            : "dark:hover:bg-gray-600 hover:bg-[#c4c4c4] dark:bg-gray-700 bg-gray-300"
                        }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {group.visibility === "public" ? (
                            <Globe size={20} className="text-white" />
                          ) : (
                            <Lock size={20} className="text-white" />
                          )}
                        </div>
                      </div>
                      <div className="info flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-bold text-lg truncate ${
                              location.pathname === `/chat/${group.id}` ? "text-white" : "dark:text-gray-100"
                            }`}
                          >
                            {group.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              group.visibility === "public"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : isUserMember
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {group.visibility === "private" && !isUserMember ? "Join Required" : group.visibility}
                          </span>
                        </div>
                        <p
                          className={`text-sm text-nowrap truncate mb-2 ${
                            location.pathname === `/chat/${group.id}`
                              ? "text-gray-100"
                              : "dark:text-gray-300"
                          }`}
                        >
                          {group.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span
                              className={
                                location.pathname === `/chat/${group.id}` ? "text-gray-200" : "text-gray-500 dark:text-gray-400"
                              }
                            >
                              {getActualMemberCount(group)} members
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span
                              className={
                                location.pathname === `/chat/${group.id}` ? "text-gray-200" : "text-gray-500 dark:text-gray-400"
                              }
                            >
                              {formatDate(group.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Invite Button - appears on hover */}
                      <button
                        onClick={(e) => handleInviteClick(e, group.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          location.pathname === `/chat/${group.id}`
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-gray-600/20 text-gray-600 dark:text-gray-400 hover:bg-gray-600/30"
                        }`}
                        title="Invite to group"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup onClose={() => setShowCreateGroup(false)} />
      )}

      {/* Group Invite Modal */}
      {showInviteModal && selectedGroupId && (
        <GroupInvite
          groupId={selectedGroupId}
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedGroupId(null);
          }}
        />
      )}
    </>
  );
};

export default GroupsList; 