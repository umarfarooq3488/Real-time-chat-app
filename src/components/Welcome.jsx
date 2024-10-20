import React from "react";
import Navbar from "./Navbar";
import WhatsappImg from "./whatsapp.png";
import GoogleImg from "./newGoogle.png";
import { auth } from "../config/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const signInGoogle = () => {
  const provide = new GoogleAuthProvider();
  signInWithPopup(auth, provide);
};

const Welcome = () => {
  return (
    <div className="text-white h-screen">
      <Navbar />
      <section className="flex flex-col justify-center h-[90.5%] items-center bg-gray-200 text-black dark:bg-gray-900 dark:text-white p-4 sm:p-8">
        <h1 className="text-4xl font-bold mb-4 text-teal-600 dark:text-teal-400">
          Join LinkLine: Your Hub for Seamless Conversations!
        </h1>
        <p className="text-lg mb-6 text-gray-800 dark:text-gray-300">
          Link, chat, and share with just a tap. Join now and start connecting
          instantly!
        </p>
        <img
          src={WhatsappImg}
          alt="React Logo"
          className="w-32 h-32 mb-6 animate-pulse"
        />
        <small className="mb-8 text-sm text-gray-700 dark:text-gray-500">
          You need to login to start the chat below.
        </small>

        {/* Login form */}
        <div
          onClick={signInGoogle}
          className="login flex items-center border border-teal-400 rounded-lg px-6 py-3 cursor-pointer hover:bg-teal-500 hover:text-gray-900 animate-bounce transition duration-1000"
        >
          <span className="mr-1 text-md sm:text-lg font-medium">
            Continue with Google
          </span>
          <img src={GoogleImg} className="w-8" alt="Google Icon" />
        </div>
      </section>
    </div>
  );
};

export default Welcome;
