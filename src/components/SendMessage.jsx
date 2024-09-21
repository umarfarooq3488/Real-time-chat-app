import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
            className="w-full p-3 text-black"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="px-5 text-white text-lg font-semibold rounded-lg py-1 bg-teal-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendMessage;
