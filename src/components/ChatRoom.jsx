import React, { useEffect, useState } from "react";
import Message from "./Message";
import { dataBase, auth } from "../config/firebase";
import SendMessage from "./SendMessage";
import { useUser } from "../context/UserContext";
import createConversationId from "../lib/SortingUserId";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

const ChatRoom = ({ scroll }) => {
  const [messages, setMessages] = useState([]);
  const [botTyping, setBotTyping] = useState(false); // ⬅️ moved here
  const { chatType, selectedUserId } = useUser();

  useEffect(() => {
    try {
      if (chatType === "private") {
        const conversationId = createConversationId(
          selectedUserId,
          auth.currentUser?.uid
        );
        const q = query(
          collection(dataBase, `PrivateMessages/${conversationId}/Messages`),
          orderBy("createAt", "desc"),
          limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchMessages = snapshot.docs.map((doc) => ({
            messageId: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchMessages.reverse());
        });

        return () => unsubscribe();
      }

      if (chatType === "group") {
        const MyQuery = query(
          collection(dataBase, `groups/${selectedUserId}/messages`),
          orderBy("createAt", "desc"),
          limit(50)
        );

        const unsubscribe = onSnapshot(MyQuery, (snapshot) => {
          const fetchMessages = snapshot.docs.map((doc) => ({
            messageId: doc.id,
            ...doc.data(),
          }));
          setMessages(fetchMessages.reverse());
        });

        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [chatType, selectedUserId]);

  useEffect(() => {
    if (scroll.current) {
      scroll.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {chatType !== null ? (
        <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-110px)] bg-gray-200 dark:bg-gray-900">
          {/* Messages pane */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar w-full gap-3 flex flex-col px-2 md:px-6 py-4">
            {messages.map((msg) => (
              <Message key={msg.messageId} id={msg.id} message={msg} />
            ))}

            {/* 👇 Typing bubble appears like a message */}
            {botTyping && (
              <div className="flex w-full px-2 mb-2">
                <div className="image flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-gray-500" />
                </div>
                <div className="dark:bg-gray-700 bg-gray-800 text-white p-3 rounded-lg max-w-[70%]">
                  <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                    <span className="font-bold text-teal-300">ExplainBot</span>
                    <span>AI</span>
                  </div>
                  <div className="text-sm opacity-80">typing…</div>
                </div>
              </div>
            )}

            <span ref={scroll}></span>
          </div>
          {/* Input */}
          <div className="w-full">
            <SendMessage scroll={scroll} setBotTyping={setBotTyping} />
          </div>
        </div>
      ) : (
        <div className="flex dark:bg-gray-900 bg-gray-200 justify-center h-[89vh] font-thin items-center text-4xl lg:text-8xl text-gray-400">
          Message Now
        </div>
      )}
    </>
  );
};

export default ChatRoom;
