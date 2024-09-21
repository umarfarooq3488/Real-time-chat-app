import React, { createContext, useContext, useState } from "react";

const userContext = createContext();

export const UserProvider = ({ children }) => {
  const [chatType, setChatType] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <userContext.Provider
      value={{ chatType, setChatType, selectedUserId, setSelectedUserId }}
    >
      {children}
    </userContext.Provider>
  );
};

export const useUser = () => useContext(userContext);
