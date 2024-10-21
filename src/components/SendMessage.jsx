import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import { LiaArrowCircleUpSolid } from "react-icons/lia";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");
  const { chatType, selectedUserId } = useUser();

  const sendMessage = async (e) => {
    e.preventDefault();

    if (message === "") {
      alert("Please enter a message");
      return;
    }

    const { displayName, uid, photoURL } = auth.currentUser;

    if (chatType === "private") {
      // Private chat: create conversation ID using user IDs
      const conversationId = createConversationId(uid, selectedUserId);
      await addDoc(
        collection(dataBase, `PrivateMessages/${conversationId}/Messages`),
        {
          text: message,
          name: displayName,
          avatar: photoURL,
          senderId: uid,
          id: uid,
          receiverId: selectedUserId,
          createAt: serverTimestamp(),
        }
      );
    } else {
      // Group chat: send message to the "Messages" collection
      await addDoc(collection(dataBase, "Messages"), {
        text: message,
        name: displayName,
        avatar: photoURL,
        createAt: serverTimestamp(),
        id: uid,
      });
    }

    setMessage("");
    scroll.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <div className="sendbox bg-gray-300 dark:bg-gray-800 p-4">
        <form onSubmit={sendMessage} className="flex gap-2" action="">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full dark:bg-gray-600 dark:text-gray-100 p-3 text-black"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="px-3 text-white text-lg font-semibold rounded-lg py-1 bg-teal-600"
          >
            <LiaArrowCircleUpSolid className="hover:rotate-[360deg] transition-all duration-700 text-4xl" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendMessage;
