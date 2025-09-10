import React, { useState } from "react";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { MdArrowOutward, MdContentCopy, MdDelete } from "react-icons/md";
import { FiArrowDownRight } from "react-icons/fi";
import { Bot, AtSign, FileText, Image, File } from "lucide-react";
import FileViewer from "./FileViewer";

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatTextToHtml = (text) => {
  if (!text) return "";
  // Escape HTML first
  let html = escapeHtml(text);
  // Bold double-asterisk segments: **bold**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Preserve line breaks
  html = html.replace(/\n/g, "<br/>");
  return html;
};

const Message = ({ message, id }) => {
  const [user] = useAuthState(auth);

  const [copied, setCopied] = useState(false);
  const [deleteState, setDeleteState] = useState(false);

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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDelete = () => {
    setDeleteState(true);
  };

  const renderMessageType = () => {
    if (!message.type) return null;

    const typeConfig = {
      text: { icon: null, label: "Text", color: "text-gray-400" },
      file: { icon: File, label: "File", color: "text-blue-400" },
      aiResponse: { icon: Bot, label: "AI", color: "text-purple-400" },
    };

    const config = typeConfig[message.type] || typeConfig.text;
    const IconComponent = config.icon;

    return (
      <div className={`flex items-center gap-1 text-xs ${config.color}`}>
        {IconComponent && <IconComponent size={12} />}
        <span>{config.label}</span>
      </div>
    );
  };

  const renderMentions = () => {
    if (!message.mentions || message.mentions.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {message.mentions.map((mention, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
          >
            <AtSign size={10} />
            {mention}
          </span>
        ))}
      </div>
    );
  };

  const renderFileInfo = () => {
    if (!message.file) return null;

    const getFileIcon = (fileType) => {
      if (fileType.startsWith('image/')) return Image;
      if (fileType.startsWith('text/')) return FileText;
      return File;
    };

    const FileIcon = getFileIcon(message.file.type);

    return (
      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <FileIcon size={16} className="text-blue-500" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {message.file.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {(message.file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col sm:flex-row ${
        id === user?.uid ? "justify-end" : ""
      } w-full px-2 mb-4`}
    >
      <div className="image flex-shrink-0 mb-2 max-w-[50%] sm:mb-0 sm:mr-3">
        <img src={message.avatar} className="w-8 sm:w-10 rounded-full" alt="" />
      </div>
      <div
        key={id}
        className={`dark:bg-gray-700 ${
          id === user?.uid
            ? "dark:bg-green-900 bg-green-800 hover:bg-green-900 dark:hover:bg-green-950"
            : "hover:bg-gray-900 dark:hover:bg-gray-800 bg-gray-800"
        } text-white p-3 sm:p-4 rounded-lg max-w-[100%] sm:max-w-[70%] md:max-w-[60%] relative`}
      >
        <div className="info flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mb-2">
            <div
              className={`name font-bold text-base sm:text-lg ${
                id === user?.uid ? "text-teal-200" : "text-teal-300"
              }`}
            >
              {message.name}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
              {renderMessageType()}
              <span>{formattedDate}</span>
              <span className="mx-1">•</span>
              <span>{formattedTime}</span>
            </div>
          </div>
          {!deleteState ? (
            <div
              className="message whitespace-pre-wrap break-words font-sans text-sm sm:text-base leading-normal"
              dangerouslySetInnerHTML={{ __html: formatTextToHtml(message.text) }}
            />
          ) : (
            <span className="text-sm italic">This message was deleted</span>
          )}
          
          {renderMentions()}
          {renderFileInfo()}

          {message.fileURL && !message.file && (
            <FileViewer fileURL={message.fileURL} fileType={message.fileType} />
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
            {id === user?.uid && deleteState != true ? (
              <button
                onClick={handleDelete}
                className="p-1 mb-5 hover:bg-gray-700 rounded-full transition-colors duration-200"
                title="Delete message"
              >
                <MdDelete className={`text-xl text-red-600`} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
