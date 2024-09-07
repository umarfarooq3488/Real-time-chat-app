import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    if (message === "") {
      alert("Please enter a message");
      return;
    }

    const { displayName, uid, photoURL } = auth.currentUser;

    await addDoc(collection(dataBase, "Messages"), {
      text: message,
      name: displayName,
      avatar: photoURL,
      createAt: serverTimestamp(),
      id: uid,
    });
    setMessage("");
    scroll.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div>
      <div className="sendbox bg-gray-400 dark:bg-gray-800 p-5 absolute bottom-0 w-full">
        <form onSubmit={sendMessage} className="flex gap-2" action="">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3"
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
