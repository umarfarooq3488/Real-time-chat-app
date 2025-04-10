import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import { LiaArrowCircleUpSolid } from "react-icons/lia";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");
  const { chatType, selectedUserId } = useUser();
  const { isGuest } = useGuest();

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const { displayName, uid, photoURL } = auth.currentUser;
    const messageData = {
      text: message,
      name: displayName,
      avatar: photoURL,
      createAt: serverTimestamp(),
      id: uid,
    };

    if (chatType === "private") {
      const conversationId = createConversationId(uid, selectedUserId);
      await addDoc(
        collection(dataBase, `PrivateMessages/${conversationId}/Messages`),
        {
          ...messageData,
          senderId: uid,
          receiverId: selectedUserId,
        }
      );
    } else {
      await addDoc(collection(dataBase, "Messages"), messageData);
    }

    setMessage("");
    scroll.current.scrollIntoView({ behavior: "smooth" });
  };

  if (isGuest) {
    return (
      <div className="sendbox bg-gray-300 h-[10px] dark:bg-gray-800 p-4 text-center">
        Create an account to send messages
      </div>
    );
  }

  return (
    <div className="sendbox bg-gray-300 h-[80px] max-w-[100%] md:max-w-[80%] lg:max-w-full dark:bg-gray-800 p-4">
      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <div className="relative w-full">
          <textarea
            value={message}
            style={{
              whiteSpace: "pre-wrap",
              maxHeight: "400px",
              minHeight: "20px",
              position: "relative",
              bottom: 0,
            }}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[50px] dark:bg-gray-600 dark:text-gray-100 p-3 text-black 
                     overflow-y-auto resize-none font-mono whitespace-pre-wrap"
            placeholder="Type a message..."
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
            }}
          />
        </div>
        <button
          type="submit"
          className="px-1 h-10 border-b-2 border-black w-10 text-white text-lg font-semibold rounded-full py-1 bg-teal-600"
        >
          <LiaArrowCircleUpSolid className="hover:rotate-[360deg] transition-all duration-700 text-3xl" />
        </button>
      </form>
    </div>
  );
};

export default SendMessage;
