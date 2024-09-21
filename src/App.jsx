import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { auth } from "./config/firebase";
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

function App() {
  const [themeMode, setThemeMode] = useState("light");
  const [user] = useAuthState(auth);
  // const [User, setUser] = useState([]);

  // functions to toggle the theme
  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };
  // Set the class in the html using useEffect
  useEffect(() => {
    document.querySelector("html").classList.remove("dark", "light");
    document.querySelector("html").classList.add(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (user) {
      const { uid, displayName } = user; // Use the `user` object directly
      const MyQuery = query(
        collection(dataBase, "Users"),
        orderBy("uid", "asc"),
        limit(50)
      );

      // Fetch users from the database and check if the current user already exists
      const unsubscribe = onSnapshot(MyQuery, (snapshot) => {
        const fetchUsers = snapshot.docs.map((doc) => ({
          messageId: doc.id,
          ...doc.data(),
        }));

        const userFound = fetchUsers.some(
          (user) => user.uid === uid && user.displayName === displayName
        );

        if (!userFound) {
          SaveUserData(); // Only save user if they are not already in the database
        }
      });

      return () => unsubscribe(); // Cleanup on component unmount
    }
  }, [user]);
  const MemorizedValues = useMemo(
    () => ({
      themeMode,
      toggleTheme,
    }),
    [themeMode]
  );

  return (
    <>
      <UserProvider>
        <ThemeProvider value={MemorizedValues}>
          <Suspense fallback={<div>Loading...</div>}>
            <div className="bg-gray-300 dark:bg-gray-800 h-screen">
              {user ? <ChatBox /> : <Welcome />}
            </div>
          </Suspense>
        </ThemeProvider>
      </UserProvider>
    </>
  );
}

export default App;
