import React from "react";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { MdArrowOutward } from "react-icons/md";
import { FiArrowDownRight } from "react-icons/fi";

const Message = ({ message, id }) => {
  const [user] = useAuthState(auth);

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

  return (
    <div className={`flex ${id === user.uid ? "self-end" : ""}`}>
      <div className="image flex-shrink-0 m-2">
        <img src={message.avatar} className="w-10 rounded-full" alt="" />
      </div>
      <div
        key={id}
        className={`dark:bg-gray-700 ${
          id === user.uid
            ? "dark:bg-green-900 bg-green-800 hover:bg-green-900 dark:hover:bg-green-950"
            : "hover:bg-gray-900 dark:hover:bg-gray-800 bg-gray-800"
        } text-white p-5 pr-10 pt-2 flex gap-3 rounded-lg max-w-[500px]`}
      >
        <div className="info relative flex flex-col">
          <div className="flex sm:flex-row flex-col sm:items-center sm:gap-2">
            <div
              className={`name font-bold text-lg ${
                id === user.uid && "text-teal-200"
              } text-teal-300`}
            >
              {message.name}
            </div>
            <div className="flex">
              <span className="text-sm text-gray-200">{formattedDate}</span>
              <span className="text-sm mx-1 text-gray-200">
                {formattedTime}
              </span>
            </div>
          </div>
          <div className="message">{message.text}</div>
          {id === user.uid ? (
            <div
              className={`text-gray-300 absolute -bottom-3 -right-5 text-sm`}
            >
              <MdArrowOutward className="text-lg" />
            </div>
          ) : (
            <div
              className={`text-gray-300 absolute -bottom-3 -right-5 text-sm`}
            >
              <FiArrowDownRight className="text-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
