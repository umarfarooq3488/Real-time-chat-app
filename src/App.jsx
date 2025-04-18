import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { auth } from "@/config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import SaveUserData from "./components/User/SaveUserData";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { dataBase } from "./config/firebase";

const ChatBox = lazy(() => import("./components/ChatBox"));
const Welcome = lazy(() => import("./components/Welcome"));

// import the contextProvider
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { GuestProvider } from "./context/GuestUserContext";
import { useGuest } from "./context/GuestUserContext";

const AppContent = () => {
  const { isGuest } = useGuest();
  const [user] = useAuthState(auth);
  const [userToSave, setUserToSave] = useState(false);

  useEffect(() => {
    if (user) {
      const { uid, displayName } = user;
      const MyQuery = query(
        collection(dataBase, "Users"),
        orderBy("uid", "asc"),
        limit(50)
      );

      const unsubscribe = onSnapshot(MyQuery, (snapshot) => {
        const fetchUsers = snapshot.docs.map((doc) => ({
          messageId: doc.id,
          ...doc.data(),
        }));

        const userFound = fetchUsers.some(
          (user) => user.uid === uid && user.displayName === displayName
        );

        if (!userFound && auth.currentUser) {
          setUserToSave(true);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleSaveComplete = (success) => {
    if (success) {
      console.log("User save process completed successfully.");
      setUserToSave(false);
    } else {
      console.error("User save process failed.");
    }
  };

  return (
    <div className="bg-gray-300 dark:bg-gray-800 h-screen">
      {user || isGuest ? <ChatBox /> : <Welcome />}
      {userToSave && <SaveUserData onSaveComplete={handleSaveComplete} />}
    </div>
  );
};

function App() {
  const [themeMode, setThemeMode] = useState("light");

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.querySelector("html").classList.remove("dark", "light");
    document.querySelector("html").classList.add(themeMode);
  }, [themeMode]);

  const MemorizedValues = useMemo(
    () => ({
      themeMode,
      toggleTheme,
    }),
    [themeMode]
  );

  return (
    <GuestProvider>
      <UserProvider>
        <ThemeProvider value={MemorizedValues}>
          <Suspense fallback={<div>Loading...</div>}>
            <AppContent />
          </Suspense>
        </ThemeProvider>
      </UserProvider>
    </GuestProvider>
  );
}

export default App;
