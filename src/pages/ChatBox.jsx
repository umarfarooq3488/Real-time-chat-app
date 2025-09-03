import React, { useRef, useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import ChatRoom from "../components/ChatRoom";
import User_sidebar from "../components/User/User_sidebar";
import SideIcons from "../components/User/SideIcons";
import { useGuest } from "@/context/GuestUserContext";
import { auth, dataBase } from "@/config/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import PeopleModal from "@/components/User/PeopleModal";

const ChatBox = () => {
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);
  const { isGuest, guestSessionStart, endGuestSession } = useGuest();
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [meDoc, setMeDoc] = useState(null);

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

  // Fetch current user data
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

  // Fetch visible users for PeopleModal
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

  const openPeople = () => {
    setPeopleOpen(true);
  };

  const closePeople = () => {
    setPeopleOpen(false);
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
          <ChatRoom scroll={scrollRef} />
        </div>
      </div>
      <PeopleModal open={peopleOpen} onClose={closePeople} currentUser={meDoc} users={allUsers} />
    </div>
  );
};

export default ChatBox;
