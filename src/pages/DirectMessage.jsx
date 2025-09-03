import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../layouts/Navbar";
import ChatRoom from "../components/ChatRoom";
import User_sidebar from "../components/User/User_sidebar";
import SideIcons from "../components/User/SideIcons";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import { auth, dataBase } from "@/config/firebase";
import { doc, onSnapshot, collection, onSnapshot as onSnapshotColl, query, where, orderBy, limit } from "firebase/firestore";
import PeopleModal from "@/components/User/PeopleModal";

const DirectMessage = () => {
  const { userId } = useParams();
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);
  const { isGuest, guestSessionStart, endGuestSession } = useGuest();
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const { setChatType, setSelectedUserId } = useUser();
  const [canChat, setCanChat] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [peopleOpen, setPeopleOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [meDoc, setMeDoc] = useState(null);

  useEffect(() => {
    // Set the chat type to private when this component mounts
    setChatType("private");
    setSelectedUserId(userId);
  }, [userId, setChatType, setSelectedUserId]);

  useEffect(() => {
    // subscribe to current user's connections
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const ref = doc(dataBase, "Users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return setCanChat(false);
      const data = snap.data();
      setMeDoc({ id: snap.id, ...data });
      const connections = new Set(data?.connections || []);
      setCanChat(connections.has(userId));
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    // fetch visible users for PeopleModal
    const q = query(
      collection(dataBase, "Users"),
      where("visible", "==", true),
      orderBy("userId", "asc"),
      limit(50)
    );
    const unsub = onSnapshotColl(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ UserId: d.id, ...d.data() }));
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // auto open People modal via URL ?people=1
    const params = new URLSearchParams(location.search);
    setPeopleOpen(params.get("people") === "1");
  }, [location.search]);

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

  const openPeople = () => {
    setPeopleOpen(true);
  };

  const closePeople = () => {
    setPeopleOpen(false);
  };

  const goToPeople = () => {
    // Append ?people=1
    if (location.pathname.startsWith("/dm/")) {
      const params = new URLSearchParams(location.search);
      params.set("people", "1");
      navigate(`${location.pathname}?${params.toString()}`);
    }
  };

  return (
    <div>
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
          <User_sidebar setShowSideBar={setShowSideBar} onOpenPeople={openPeople} />
        </div>
        <div className="flex-grow">
          {canChat ? (
            <ChatRoom scroll={scrollRef} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[89vh] text-center p-6">
              <div className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                You're not connected yet
              </div>
              <div className="text-gray-600 dark:text-gray-300 max-w-md mb-4">
                Send a connection request. Once accepted, you can start chatting.
              </div>
              <button onClick={goToPeople} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                Open People
              </button>
            </div>
          )}
        </div>
      </div>
      <PeopleModal open={peopleOpen} onClose={closePeople} currentUser={meDoc} users={allUsers} />
    </div>
  );
};

export default DirectMessage; 