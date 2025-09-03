import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "@/config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import SaveUserData from "./components/User/SaveUserData";
import PrivateRoute from "./layouts/PrivateRoute";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { dataBase } from "./config/firebase";

const ChatBox = lazy(() => import("./pages/ChatBox"));
const Welcome = lazy(() => import("./pages/Welcome"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const DirectMessage = lazy(() => import("./pages/DirectMessage"));
const Profile = lazy(() => import("./pages/Profile"));
const JoinGroup = lazy(() => import("./pages/JoinGroup"));

// import the contextProvider
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { GuestProvider } from "./context/GuestUserContext";
import { useGuest } from "./context/GuestUserContext";
import { UserVisibilityProvider } from "./context/userVisibilityContext";

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
    <Router>
      <div className="bg-gray-300 dark:bg-gray-800 h-screen">
        <Routes>
          {/* Public route - Welcome page */}
          <Route path="/" element={<Welcome />} />
          
          {/* Public route - Join group via invite link */}
          <Route path="/join-group/:groupId" element={<JoinGroup />} />
          
          {/* Protected routes - require authentication */}
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>  
                <ChatBox />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/chat/:groupId" 
            element={
              <PrivateRoute>
                <GroupChat />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dm/:userId" 
            element={
              <PrivateRoute>
                <DirectMessage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile/:userId" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {userToSave && <SaveUserData onSaveComplete={handleSaveComplete} />}
      </div>
    </Router>
  );
};

function App() {
  const [themeMode, setThemeMode] = useState("dark");

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

  const [user] = useAuthState(auth); // Moved useAuthState here to be accessible by UserVisibilityProvider

  return (
    <GuestProvider>
      <UserProvider>
        <UserVisibilityProvider user={user}>
        <ThemeProvider value={MemorizedValues}>
          <Suspense fallback={<div>Loading...</div>}>
            <AppContent />
            </Suspense>
          </ThemeProvider>
        </UserVisibilityProvider>
      </UserProvider>
    </GuestProvider>
  );
}

export default App;
