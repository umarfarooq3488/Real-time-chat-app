import React, { useRef } from "react";
import Navbar from "./Navbar";
import ChatRoom from "./ChatRoom";
import SendMessage from "./SendMessage";

const ChatBox = () => {
  const scrollRef = useRef();
  return (
    <div>
      <Navbar />
      <ChatRoom scroll={scrollRef} />
      <SendMessage scroll={scrollRef} />
    </div>
  );
};

export default ChatBox;
