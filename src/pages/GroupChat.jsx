import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, dataBase } from "../config/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import Navbar from "../layouts/Navbar";
import ChatRoom from "../components/ChatRoom";
import User_sidebar from "../components/User/User_sidebar";
import SideIcons from "../components/User/SideIcons";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import { AlertCircle } from "lucide-react";
import PeopleModal from "@/components/User/PeopleModal";

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [group, setGroup] = useState(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const { isGuest } = useGuest();
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const { setChatType, setSelectedUserId } = useUser();
  
  // People modal state
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [meDoc, setMeDoc] = useState(null);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    // Set the chat type to group when this component mounts
    setChatType("group");
    setSelectedUserId(groupId);
  }, [groupId, setChatType, setSelectedUserId]);

  // Restore People modal data sources
  useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const ref = doc(dataBase, "Users", auth.currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setMeDoc({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(dataBase, "Users"),
      where("visible", "==", true),
      orderBy("userId", "asc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ UserId: d.id, ...d.data() }));
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  // Check if user has access to this group
  useEffect(() => {
    const checkGroupAccess = async () => {
      // Reset state before each check
      setShowAccessDenied(false);
      setHasAccess(false);

      if (!auth.currentUser || isGuest) {
        setLoading(false);
        return;
      }

      try {
        // Fetch group data
        const groupSnap = await getDoc(doc(dataBase, "groups", groupId));
        if (!groupSnap.exists()) {
          setShowAccessDenied(true);
          setLoading(false);
          return;
        }
        const groupData = { id: groupId, ...groupSnap.data() };
        setGroup(groupData);

        // Enforce visibility/membership
        const visibility = groupData.visibility || "public";
        if (visibility === "public") {
          setHasAccess(true);
          setShowAccessDenied(false);
        } else if (visibility === "private") {
          // Check membership
          const userSnap = await getDoc(doc(dataBase, "Users", auth.currentUser.uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          const groupsJoined = Array.isArray(userData.groupsJoined) ? userData.groupsJoined : [];
          const isMember = groupsJoined.includes(groupId);
          if (isMember) {
            setHasAccess(true);
            setShowAccessDenied(false);
          } else {
            setHasAccess(false);
            setShowAccessDenied(true);
          }
        } else {
          // Unknown visibility -> deny by default
          setHasAccess(false);
          setShowAccessDenied(true);
        }
      } catch (error) {
        console.error("Error checking group access:", error);
        setShowAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };

    checkGroupAccess();
  }, [groupId, isGuest]);

  // People modal handlers
  const openPeople = () => setPeopleOpen(true);
  const closePeople = () => setPeopleOpen(false);

  // Upload modal handlers
  const openUpload = () => { setUploadMsg(""); setUploadFile(null); setUploadOpen(true); };
  const closeUpload = () => { if (!uploading) setUploadOpen(false); };

  const handleUpload = async () => {
    if (!uploadFile) { setUploadMsg("Please choose a file."); return; }
    try {
      setUploading(true);
      setUploadMsg("Uploading...");
      const api = import.meta.env.VITE_BOT_API_URL || "http://localhost:8000";
      const form = new FormData();
      form.append("file", uploadFile);
      const res = await fetch(`${api}/rag/upload?group_id=${encodeURIComponent(groupId)}`, {
        method: "POST",
        body: form
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload failed: ${res.status} ${text}`);
      }
      const json = await res.json();
      setUploadMsg(`Uploaded: ${json.filename} (${json.chunk_count} chunks)`);
      setTimeout(() => { setUploadOpen(false); }, 800);
    } catch (e) {
      console.error(e);
      setUploadMsg(String(e.message || e));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return null;

  const isCreator = !!group && auth.currentUser && (group.createdBy === auth.currentUser.uid || group.creatorId === auth.currentUser.uid);

  return (
    <div className="home">
      {showAccessDenied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle size={18} />
          <span>Access denied to this group.</span>
        </div>
      )}

      <Navbar />
      <div className="flex bg-gray-300 dark:bg-gray-800 m-0">
        <SideIcons setShowSideBar={setShowSideBar} />
        <div className={`${showSideBar ? "" : "hidden md:block"}`}>
          <User_sidebar setShowSideBar={setShowSideBar} onOpenPeople={openPeople} />
        </div>
        <div className="flex-grow relative">
          {/* Absolutely positioned action to avoid layout height changes */}
          {hasAccess && isCreator && (
            <button
              onClick={openUpload}
              title="Upload context"
              aria-label="Upload context for this group"
              className="absolute md:top-3 md:right-3 md:bottom-auto md:left-auto bottom-20 right-3 z-10 inline-flex items-center gap-2 px-3 sm:px-4 h-10 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-teal-500 hover:to-teal-400 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 backdrop-blur bg-opacity-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L7.279 11.707a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z" />
                <path d="M5 15a1 1 0 011 1v2a2 2 0 002 2h8a2 2 0 002-2v-2a1 1 0 112 0v2a4 4 0 01-4 4H8a4 4 0 01-4-4v-2a1 1 0 011-1z" />
              </svg>
              <span className="hidden sm:inline">Upload context</span>
            </button>
          )}
          {hasAccess ? (
            <ChatRoom scroll={scrollRef} />
          ) : (
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300">You do not have access to view this group.</div>
          )}
        </div>
      </div>
      {/* Upload modal (fixed overlay, no layout shift) */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-[90%] max-w-md">
            <div className="text-lg font-semibold mb-2">Upload context for this group</div>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files && e.target.files[0])}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer focus:outline-none dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-gray-600 dark:text-gray-300 mr-auto">{uploadMsg}</span>
              <button onClick={closeUpload} disabled={uploading} className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-sm">
                Cancel
              </button>
              <button onClick={handleUpload} disabled={uploading || !uploadFile} className="px-3 py-1 rounded bg-teal-600 text-white text-sm hover:bg-teal-700">
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
      <PeopleModal open={peopleOpen} onClose={closePeople} currentUser={meDoc} users={allUsers} />
    </div>
  );
};

export default GroupChat; 