import React, { useState, useEffect, useRef } from "react";
import { auth, dataBase } from "../config/firebase";
import { LiaArrowCircleUpSolid } from "react-icons/lia";
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { useGuest } from "@/context/GuestUserContext";
import { useUser } from "../context/UserContext";
import createConversationId from "../lib/SortingUserId";
import { FileUploader } from "@/Cloudinary/FileUploader";
import { useUserVisibility } from "../context/userVisibilityContext";
import { callExplainBot, callHelpBot } from "../services/botService";

const SendMessage = ({ scroll, setBotTyping }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [FileDownloadUrl, setFileDownloadUrl] = useState(null);
  const { chatType, selectedUserId } = useUser(); // selectedUserId is groupId when chatType === "group"
  const { isGuest } = useGuest();
  const { visible, loading } = useUserVisibility();

  const isFirstRender = useRef(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const getMessageType = (text, hasFile) => {
    if (hasFile) return "file";
    if (text.includes("@explain") || text.includes("@notes") || text.includes("@help")) return "aiResponse";
    return "text";
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!isFirstRender.current && !loading && visible === false) {
      alert("You are invisible. Set your visibility to send messages.");
      return;
    }

    if (message.trim() === "" && !selectedFile) return;

    try {
      const { displayName, uid, photoURL } = auth.currentUser;

      // If there's a file selected but no URL yet, upload it first
      let fileUrl = FileDownloadUrl;
      if (selectedFile && !fileUrl) {
        fileUrl = await FileUploader(selectedFile);
        if (!fileUrl) {
          alert("Failed to upload file. Please try again.");
          return;
        }
        setFileDownloadUrl(fileUrl);
      }

      const mentions = extractMentions(message);
      const messageType = getMessageType(message, !!selectedFile);

      const baseMessageData = {
        text: message.trim(),
        name: displayName,
        avatar: photoURL,
        createAt: serverTimestamp(),
        id: uid,
        type: messageType,
        mentions: mentions,
        ...(selectedFile && fileUrl && {
          file: {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            url: fileUrl,
          },
        }),
      };

      if (chatType === "private") {
        const conversationId = createConversationId(uid, selectedUserId);
        await addDoc(
          collection(dataBase, `PrivateMessages/${conversationId}/Messages`),
          {
            ...baseMessageData,
            senderId: uid,
            receiverId: selectedUserId,
          }
        );
      } else {
        // Group chat path: groups/{groupId}/messages
        const groupId = selectedUserId;
        const groupMessagesCol = collection(dataBase, `groups/${groupId}/messages`);

        // 1) Store the user's message in the group
        await addDoc(groupMessagesCol, baseMessageData);

        // 2) If @explain or @help present, show typing indicator and remove it when the bot message actually arrives
        const hasExplain = message.toLowerCase().includes("@explain");
        const hasHelp = message.toLowerCase().includes("@help");
        if (hasExplain || hasHelp) {
          setBotTyping(true);

          // Prepare timeout id BEFORE callbacks use it
          let timeoutId;

          // Listen for the latest message and stop typing when the latest is from the bot
          const startedAt = Date.now();
          const qLatest = query(
            groupMessagesCol,
            orderBy("createAt", "desc"),
            limit(1)
          );
          const unsubscribe = onSnapshot(qLatest, (snap) => {
            const doc = snap.docs[0];
            if (!doc) return;
            const data = doc.data();
            const isBot = data?.id === "bot";
            const ts = data?.createAt?.seconds ? data.createAt.seconds * 1000 : 0;
            if (isBot && ts >= startedAt - 2000) {
              setBotTyping(false);
              unsubscribe();
              if (timeoutId) clearTimeout(timeoutId);
            }
          });

          // ⏳ Fallback: stop typing after 20s if no bot reply
          timeoutId = setTimeout(() => {
            setBotTyping(false);
            unsubscribe();
          }, 20000);

          try {
            const apiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:8000';
            console.log("Calling bot API…", { url: apiUrl, groupId, userId: uid });
            if (hasExplain) {
              await callExplainBot({ message, groupId, userId: uid, username: displayName || "User", context: [] });
            } else if (hasHelp) {
              await callHelpBot({ message, groupId, userId: uid, username: displayName || "User", context: [] });
            }
          } catch (err) {
            console.error("Bot error:", err);
            setBotTyping(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
        }
      }

      setMessage("");
      setSelectedFile(null);
      setFileDownloadUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      scroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error sending message:", error);
      setBotTyping(false);
    }
  };

  useEffect(() => {
    const geturl = async () => {
      const url = await FileUploader(selectedFile);
      setFileDownloadUrl(url);
    };
    if (selectedFile) {
      geturl();
    }
  }, [selectedFile]);

  if (isGuest) {
    return (
      <div className="sendbox bg-gray-300 h-[10px] dark:bg-gray-800 p-4 text-center">
        {/* Guest users cannot send messages */}
      </div>
    );
  }

  return (
    <div className="sendbox bg-gray-300 dark:bg-gray-800 p-3">
      <form onSubmit={sendMessage} className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          {/* Styled file button inline */}
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                setSelectedFile(file);
              }
            }}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white cursor-pointer hover:bg-teal-700 shrink-0"
            title={selectedFile ? selectedFile.name : "Attach file"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M18.364 5.636a4.5 4.5 0 010 6.364l-7.07 7.07a3 3 0 11-4.243-4.243l6.364-6.364a1.5 1.5 0 012.121 2.122L9.172 16.95" />
            </svg>
          </label>

          {/* Textarea kept compact to prevent page scroll */}
          <textarea
            value={message}
            style={{
              whiteSpace: "pre-wrap",
            }}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            className="flex-1 h-12 min-h-[3rem] max-h-24 dark:bg-gray-600 dark:text-gray-100 p-3 text-black overflow-y-auto resize-none font-mono whitespace-pre-wrap rounded-lg"
            placeholder="Type a message... Use @explain, @help or @notes for AI features"
          />
        </div>
        <button
          type="submit"
          className="px-1 h-10 w-10 border-b-2 border-black text-white text-lg font-semibold rounded-full py-1 bg-teal-600 hover:bg-teal-700 shrink-0"
        >
          <LiaArrowCircleUpSolid className="hover:rotate-[360deg] transition-all duration-700 text-3xl" />
        </button>
      </form>
      {selectedFile && (
        <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 truncate">
          Selected: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default SendMessage;