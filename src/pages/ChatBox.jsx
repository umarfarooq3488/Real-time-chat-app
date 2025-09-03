import React, { useRef, useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import ChatRoom from "../components/ChatRoom";
import User_sidebar from "../components/User/User_sidebar";
import SideIcons from "../components/User/SideIcons";
import { useGuest } from "@/context/GuestUserContext";

const ChatBox = () => {
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);
  const { isGuest, guestSessionStart, endGuestSession } = useGuest();
  const [timeRemaining, setTimeRemaining] = useState(3600);

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
          <User_sidebar setShowSideBar={setShowSideBar} />
        </div>
        <div className="flex-grow">
          <ChatRoom scroll={scrollRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
