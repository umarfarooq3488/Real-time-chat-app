import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { auth } from "./config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const ChatBox = lazy(() => import("./components/ChatBox"));
const Welcome = lazy(() => import("./components/Welcome"));

// import the contextProvider
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [themeMode, setThemeMode] = useState("light");
  const [user] = useAuthState(auth);
  // functions to toggle the theme
  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };
  // Set the class in the html using useEffect
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
    <>
      <ThemeProvider value={MemorizedValues}>
        {/* Lazy loading */}
        <Suspense fallback={<div>Loading...</div>}>
          <div>{user ? <ChatBox /> : <Welcome />}</div>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default App;
