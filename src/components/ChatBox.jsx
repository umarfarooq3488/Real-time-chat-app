import React, { useRef, useEffect, useState } from "react";
import Navbar from "./Navbar";
import ChatRoom from "./ChatRoom";
import User_sidebar from "./User/User_sidebar";
import SaveUserData from "./User/SaveUserData";
import SideIcons from "./User/SideIcons";

const ChatBox = () => {
  const scrollRef = useRef();
  const [showSideBar, setShowSideBar] = useState(true);

  return (
    <div>
      <Navbar />
      <div className="flex">
        {/* Sidebar with fixed width */}
        <SideIcons setShowSideBar={setShowSideBar} />
        <div className={`${showSideBar ? "" : "hidden md:block"}`}>
          <User_sidebar setShowSideBar={setShowSideBar} />
        </div>

        {/* ChatRoom with flex-grow to take up the remaining space */}
        <div className="flex-grow">
          <ChatRoom scroll={scrollRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
