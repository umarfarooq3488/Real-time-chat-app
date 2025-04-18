import React, { useEffect, useState } from "react";
import Message from "./Message";
import { dataBase, auth } from "../config/firebase";
import SendMessage from "./SendMessage";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";

const ChatRoom = ({ scroll }) => {
  const [messages, setMessages] = useState([]);
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
          })); // Debug log
          setMessages(fetchMessages.reverse());
        });

        return () => unsubscribe();
      }

      if (chatType === "group") {
        const MyQuery = query(
          collection(dataBase, "Messages"),
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
        <div>
          <div className="dark:bg-gray-900 no-scrollbar w-[80vw] md:w-[77vw] bg-gray-200 gap-3 overflow-y-auto flex-col flex h-[74vh] xl:h-[80vh] p-2 py-10 md:p-7">
            {messages.map((msg) => (
              <Message key={msg.messageId} id={msg.id} message={msg} />
            ))}
            <span ref={scroll}></span>
          </div>
          <SendMessage scroll={scroll} />
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
