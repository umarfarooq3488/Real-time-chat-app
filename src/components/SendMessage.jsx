import React, { useState, useEffect, useRef } from "react";
import { auth, dataBase } from "../config/firebase";
import { LiaArrowCircleUpSolid } from "react-icons/lia";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import createConversationId from "./Private chat/SortingUserId";
import { FileUploader } from "@/Cloudinary/FileUploader";
import { useUserVisibility } from "../context/userVisibilityContext";

const SendMessage = ({ scroll }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [FileDownloadUrl, setFileDownloadUrl] = useState(null);
  const { chatType, selectedUserId } = useUser();
  const { isGuest } = useGuest();
  const { visible, loading } = useUserVisibility(); // visible can be undefined, true, or false

  // Ref to track if it's the very first render cycle
  const isFirstRender = useRef(true);

  // Set isFirstRender to false after the initial render
  useEffect(() => {
    isFirstRender.current = false;
  }, []); // Empty dependency array means this runs once after the initial render

  const sendMessage = async (e) => {
    e.preventDefault();

    // Allow sending on the very first render, OR if loading, OR if visible is true
    // Block ONLY if it's NOT the first render, NOT loading, AND visible is explicitly false.
    if (!isFirstRender.current && !loading && visible === false) {
      alert("You are invisible. Set your visibility to send messages.");
      return;
    }

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

  // Keep your useEffect for FileUploader, no changes needed here
  useEffect(() => {
    const geturl = async () => {
      const url = await FileUploader(selectedFile);
      setFileDownloadUrl(url);
    };
    geturl();
  }, [selectedFile]);


  // Conditional Rendering for the UI
  if (isGuest) {
    return (
      <div className="sendbox bg-gray-300 h-[10px] dark:bg-gray-800 p-4 text-center">
        Create an account to send messages
      </div>
    );
  }
  console.log(visible)
  console.log(loading)
  // Show "You are invisible" ONLY if it's NOT the first render, NOT loading, AND visible is explicitly false.
  if (!isFirstRender.current && !loading && visible === false) {
    return (
      <div className="sendbox bg-gray-300 h-[10px] dark:bg-gray-800 p-4 text-center">
        You are invisible. Set your visibility to send messages.
      </div>
    );
  }

  // Default return: Render the message input form
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
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
