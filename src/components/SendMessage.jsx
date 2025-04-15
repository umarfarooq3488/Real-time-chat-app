import React, { useState, useEffect } from "react";
import { auth, dataBase } from "../config/firebase";
import { LiaArrowCircleUpSolid } from "react-icons/lia";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";
import { FileUploader } from "@/Cloudinary/FileUploader";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [FileDownloadUrl, setFileDownloadUrl] = useState(null);
  const { chatType, selectedUserId } = useUser();
  const { isGuest } = useGuest();

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === "" && !selectedFile) return;

    try {
      const { displayName, uid, photoURL } = auth.currentUser;
      const messageData = {
        text: message.trim(),
        name: displayName,
        avatar: photoURL,
        createAt: serverTimestamp(),
        id: uid,
        // Only add file fields if a file is selected
        ...(selectedFile && {
          fileURL: FileDownloadUrl,
          fileType: selectedFile.type,
        }),
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

      // Reset form after successful send
      setMessage("");
      setSelectedFile(null);
      setFileDownloadUrl(null);
      scroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    const geturl = async () => {
      const url = await FileUploader(selectedFile);
      setFileDownloadUrl(url);
    };
    geturl();
  }, [selectedFile]);

  if (isGuest) {
    return (
      <div className="sendbox bg-gray-300 h-[10px] dark:bg-gray-800 p-4 text-center">
        Create an account to send messages
      </div>
    );
  }

  return (
    <div className="sendbox bg-gray-300 h-[80px] max-w-[100%] md:max-w-[75%] lg:max-w-full dark:bg-gray-800 p-4">
      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <div className="relative w-full">
          {selectedFile && (
            <div className="absolute -top-10 left-16 bg-gray-600 text-white text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <span className="truncate p-2 relative max-w-[200px]">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="hover:text-red-500 p-2 transition-colors duration-200"
              >
                X
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="file-upload"
              className="cursor-pointer p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-400 hover:text-gray-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </label>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
            />
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
              className="w-full h-[70px] dark:bg-gray-600 dark:text-gray-100 p-3 text-black 
                       overflow-y-auto resize-none font-mono whitespace-pre-wrap rounded-lg"
              placeholder="Type a message..."
            />
          </div>
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
