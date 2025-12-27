import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../layouts/Navbar";
import AuthRedirect from "../components/AuthRedirect";
import WhatsappImg from "../assets/whatsapp.png";
import BackgroundImg from "../assets/background.jpeg";
import linklineLogo from "../assets/linkline_logo.png";
import linklinefav from "../assets/linkline_fav.png";
import { auth } from "../config/firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useGuest } from "@/context/GuestUserContext";

const Welcome = () => {
  const navigate = useNavigate();
  const { startGuestSession } = useGuest();

  const signInGoogle = async () => {
    const provide = new GoogleAuthProvider();
    try {
      // Use redirect instead of popup for better mobile/wrapper app compatibility
      await signInWithRedirect(auth, provide);
      // User will be redirected to Google, then back to the app
      // The redirect result will be handled by AuthRedirect component
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <AuthRedirect />
      {/* Gradient overlay on background */}
      <div className="fixed inset-0 z-0">
        <img
          src={BackgroundImg}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-gray-100/90 to-gray-200/95 dark:from-gray-900/95 dark:via-slate-900/90 dark:to-slate-800/95" />
      </div>

      {/* Subtle animated background shapes */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 dark:opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 dark:opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 dark:opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Content section */}
      <section className="relative z-10 flex-1 flex flex-col justify-center items-center p-4 sm:p-8">
        <div className="max-w-4xl w-full backdrop-blur-lg bg-white/80 dark:bg-slate-900/40 p-8 rounded-2xl shadow-lg dark:shadow-2xl border border-gray-200 dark:border-slate-700/50">
          <div className="flex flex-col items-center space-y-5">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Join LinkLine
              </h1>
              <p className="text-2xl font-light text-gray-600 dark:text-slate-300">
                Your Hub for Seamless Conversations!
              </p>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full my-8">
              <div className="bg-white/80 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition">
                <h3 className="text-sky-600 dark:text-sky-400 font-semibold mb-2">
                  Instant Connect
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Link and chat with friends instantly
                </p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition">
                <h3 className="text-blue-600 dark:text-blue-400 font-semibold mb-2">
                  Secure Chat
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Your conversations, always protected
                </p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition">
                <h3 className="text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                  AI Supported Chats
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Use the build In AI features within the chats
                </p>
              </div>
            </div>

            {/* App Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-2xl opacity-10 dark:opacity-20"></div>
              <img
                src={linklinefav}
                alt="React Logo"
                className="w-32 h-32 relative animate-pulse"
              />
            </div>

            {/* Login Button */}
            <div
              onClick={signInGoogle}
              className="group relative px-8 py-4 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out hover:scale-105 hover:from-blue-500 hover:to-indigo-500 active:scale-95"
            >
              <div className="relative flex items-center space-x-4">
                <span className="text-white font-semibold text-sm sm:text-lg">
                  Start Chatting Now
                </span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            <small className="text-gray-500 text-sm dark:text-slate-400 text-center">
              Sign in securely with your Google account to begin
            </small>

            {/* Guest Login Button */}
            <button
              onClick={() => {
                startGuestSession();
                // The redirect will be handled by the PrivateRoute component
              }}
              className="px-4 py-2 border flex gap-2 border-slate-600 rounded-lg text-slate-700 dark:text-blue-200 hover:scale-105 duration-500 dark:hover:text-blue-100 hover:text-slate-900 hover:shadow transition duration-150"
            >
              Continue as Guest
              <small>(View-only access for 1 hour)</small>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// Add these CSS keyframes to your global CSS file
const style = document.createElement("style");
style.textContent = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
`;
document.head.appendChild(style);

export default Welcome;
