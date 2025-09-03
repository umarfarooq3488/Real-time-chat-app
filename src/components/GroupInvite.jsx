import React, { useState, useEffect } from "react";
import { auth, dataBase } from "../config/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Share2, Users, Link, Check, X } from "lucide-react";
import { getActualMemberCount } from "../lib/groupUtils";
import { useAuthState } from "react-firebase-hooks/auth";

const GroupInvite = ({ groupId, onClose, isOpen }) => {
  const [group, setGroup] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && groupId) {
      generateInviteLink();
      fetchGroupData();
    }
  }, [isOpen, groupId]);

  const fetchGroupData = async () => {
    try {
      const groupDoc = await getDoc(doc(dataBase, "groups", groupId));
      if (groupDoc.exists()) {
        setGroup(groupDoc.data());
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/join-group/${groupId}`;
    setInviteLink(inviteLink);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group?.name || 'our group'}`,
          text: `You're invited to join ${group?.name || 'our group'}!`,
          url: inviteLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} />
            Invite to Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {group && (
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {group.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {group.description}
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{getActualMemberCount(group)} members</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full ${
                  group.visibility === "public" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {group.visibility}
                </span>
              </div>
            </div>
          )}

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Copy link"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={shareInvite}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for joining a group via invite link
const JoinGroup = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    if (groupId) {
      fetchGroupAndJoin();
    }
  }, [groupId]);

  const fetchGroupAndJoin = async () => {
    try {
      const groupDoc = await getDoc(doc(dataBase, "groups", groupId));
      if (groupDoc.exists()) {
        setGroup({ id: groupDoc.id, ...groupDoc.data() });
      } else {
        setError("Group not found");
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!user) {
      // Store the group invitation in localStorage for later processing
      localStorage.setItem('pendingGroupInvitation', groupId);
      navigate("/");
      return;
    }

    setJoining(true);
    try {
      const { uid } = user;

      // Add user to group's members
      await updateDoc(doc(dataBase, "groups", groupId), {
        membersCount: (group.membersCount || 0) + 1,
        [`roles.${uid}`]: "member"
      });

      // Add group to user's groupsJoined
      await updateDoc(doc(dataBase, "Users", uid), {
        groupsJoined: arrayUnion(groupId)
      });
      
      // Navigate to the group
      navigate(`/chat/${groupId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      setError("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? "Loading group..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <X size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <Users size={48} className="text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Join Group
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You've been invited to join
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {group.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {group.description}
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{group.membersCount || 0} members</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full ${
                group.visibility === "public" 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {group.visibility}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={joinGroup}
              disabled={joining}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {joining ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Link size={16} />
              )}
              {joining ? "Joining..." : user ? "Join Group" : "Sign In to Join"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {!user && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              You'll be redirected to sign in, then automatically added to the group
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { GroupInvite, JoinGroup }; 