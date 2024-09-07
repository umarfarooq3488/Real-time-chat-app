import React, { useEffect, useState, useRef } from "react";
import Message from "./Message";
import { dataBase } from "../config/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

const ChatRoom = ({ scroll }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const MyQuery = query(
      collection(dataBase, "Messages"),
      orderBy("createAt", "asc"), // Order messages by creation time in ascending order
      limit(50)
    );

    const unsubscribe = onSnapshot(MyQuery, (snapshot) => {
      const fetchMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchMessages); // Update state with fetched messages
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  useEffect(() => {
    if (scroll.current) {
      scroll.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="dark:bg-gray-900 bg-gray-200 gap-3 overflow-auto flex-col flex h-[80vh] p-2 py-10 md:p-7">
      {messages.map((msg) => (
        <Message key={msg.createAt.seconds} id={msg.id} message={msg} />
      ))}
      <span ref={scroll}></span>
    </div>
  );
};

export default ChatRoom;
