import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";
import sendNotification from "@/services/NotificationService";

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

      // Retrieve the receiver's Player ID from Firestore
      const receiverDoc = await getDoc(doc(dataBase, "Users", selectedUserId));
      const receiverPlayerId = receiverDoc.data().playerId;

      // Send a notification to the receiver if their Player ID exists
      if (receiverPlayerId) {
        sendNotification(
          receiverPlayerId,
          `New message from ${displayName}: ${message}`
        );
      }
    } else {
      // Group chat: send message to the "Messages" collection
      await addDoc(collection(dataBase, "Messages"), {
        text: message,
        name: displayName,
        avatar: photoURL,
        createAt: serverTimestamp(),
        id: uid,
      });

      // Get all users in the group chat to send notifications
      const usersSnapshot = await getDocs(collection(dataBase, "Users"));
      usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data();
        if (user.playerId && user.uid !== uid) {
          // Avoid sending notifications to the sender
          sendNotification(
            user.playerId,
            `New message in group chat from ${displayName}: ${message}`
          );
        }
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
