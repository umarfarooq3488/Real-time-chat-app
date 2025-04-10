import { createContext, useContext, useState } from "react";

const GuestContext = createContext();

export const GuestProvider = ({ children }) => {
  const [isGuest, setIsGuest] = useState(false);
  const [guestSessionStart, setGuestSessionStart] = useState(null);

  const startGuestSession = () => {
    setIsGuest(true);
    setGuestSessionStart(Date.now());
    // Set session expiry
    setTimeout(() => {
      endGuestSession();
    }, 3600000); // 1 hour in milliseconds
  };

  const endGuestSession = () => {
    setIsGuest(false);
    setGuestSessionStart(null);
  };

  return (
    <GuestContext.Provider
      value={{ isGuest, startGuestSession, endGuestSession, guestSessionStart }}
    >
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => useContext(GuestContext);
