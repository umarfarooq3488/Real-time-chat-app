import React, { useState } from "react";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { MdArrowOutward, MdContentCopy, MdDelete } from "react-icons/md";
import { FiArrowDownRight } from "react-icons/fi";

const Message = ({ message, id }) => {
  const [user] = useAuthState(auth);

  const [copied, setCopied] = useState(false);
  const [deleteState, setDeleteState] = useState(false);

  // format the date here
  const formattedDate = message.createAt
    ? new Date(message.createAt.seconds * 1000).toLocaleDateString()
    : "";
  const formattedTime = message.createAt
    ? new Date(message.createAt.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDelete = () => {
    setDeleteState(true);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row ${
        id === user.uid ? "justify-end" : ""
      } w-full px-2 mb-4`}
    >
      <div className="image flex-shrink-0 mb-2 max-w-[50%] sm:mb-0 sm:mr-3">
        <img src={message.avatar} className="w-8 sm:w-10 rounded-full" alt="" />
      </div>
      <div
        key={id}
        className={`dark:bg-gray-700 ${
          id === user.uid
            ? "dark:bg-green-900 bg-green-800 hover:bg-green-900 dark:hover:bg-green-950"
            : "hover:bg-gray-900 dark:hover:bg-gray-800 bg-gray-800"
        } text-white p-3 sm:p-4 rounded-lg max-w-[100%] sm:max-w-[70%] md:max-w-[60%] relative`}
      >
        <div className="info flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mb-2">
            <div
              className={`name font-bold text-base sm:text-lg ${
                id === user.uid ? "text-teal-200" : "text-teal-300"
              }`}
            >
              {message.name}
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-300">
              <span>{formattedDate}</span>
              <span className="mx-1">•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
          {!deleteState ? (
            <pre className="message whitespace-pre-wrap break-words font-sans text-sm sm:text-base leading-normal">
              {message.text}
            </pre>
          ) : (
            <span className="text-sm italic">This message was deleted</span>
          )}
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-1 mb-5 hover:bg-gray-700 rounded-full transition-colors duration-200"
              title="Copy message"
            >
              <MdContentCopy
                className={`text-xl ${
                  copied ? "text-teal-400" : "text-gray-400 hover:text-gray-200"
                }`}
              />
            </button>
            {id === user.uid && deleteState != true ? (
              <button
                onClick={handleDelete}
                className="p-1 mb-5 hover:bg-gray-700 rounded-full transition-colors duration-200"
                title="Delete message"
              >
                <MdDelete className={`text-xl text-red-600`} />
              </button>
            ) : (
              ""
            )}
            <div
              className={`absolute -top-8 right-0 bg-gray-800 text-xs px-2 py-1 rounded 
      transition-opacity duration-200 ${copied ? "opacity-100" : "opacity-0"}`}
            >
              Copied!
            </div>
          </div>
          <div
            className={`absolute bottom-1 ${
              id === user.uid ? "right-2" : "right-2"
            } text-gray-300`}
          >
            {id === user.uid ? (
              <MdArrowOutward className="text-base sm:text-lg" />
            ) : (
              <FiArrowDownRight className="text-base sm:text-lg" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
