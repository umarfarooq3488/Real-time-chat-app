import React from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { auth } from "../../config/firebase";
import { BsChatDots } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { deleteUserByUID } from "./DeleteUser";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ThemeBtn from "../ThemeBtn";

const SideIcons = ({ setShowSideBar }) => {
  const logout = () => {
    auth.signOut();
  };
  return (
    <div className="w-10 dark:bg-gray-800 px-1 bg-gray-300 justify-between items-center flex space-y-5 pt-4 flex-col">
      <div className="top flex flex-col space-y-4">
        <RxHamburgerMenu
          onClick={() => setShowSideBar((prev) => !prev)}
          className="text-2xl cursor-pointer text-gray-700 dark:text-gray-200"
        />
        <BsChatDots
          onClick={() => setShowSideBar(true)}
          className="text-2xl cursor-pointer text-gray-700 dark:text-gray-200"
        />
      </div>
      <div className="bottom flex flex-col items-center space-y-4 py-4">
        <Popover>
          <PopoverTrigger>
            <IoSettingsOutline className="text-2xl cursor-pointer text-gray-700 dark:text-gray-200" />
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="inline-flex gap-3 w-[200px] mx-3"
          >
            Change Theme
            <ThemeBtn className="" />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger>
            <img
              src={auth.currentUser.photoURL}
              alt="Google"
              className="w-7 cursor-pointer rounded-full"
            />
          </PopoverTrigger>
          <PopoverContent
            side="top"
            className="flex overflow-hidden text-wrap gap-1 flex-col w-[300px] mx-3"
          >
            <div className="userInfo mb-10">
              <img
                src={auth.currentUser.photoURL}
                alt="Google"
                className="w-10 mx-auto cursor-pointer rounded-full"
              />
              <div className="name text-center text-lg font-bold">
                {auth.currentUser.displayName}
              </div>
              <div className="email text-center text-wrap">
                {auth.currentUser.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="border p-2 transition-all duration-500 hover:bg-teal-600 font-medium"
            >
              Logout
            </button>
            <button
              onClick={() => {
                deleteUserByUID(auth.currentUser.uid);
              }}
              className="border p-2 transition-all duration-500 hover:bg-teal-600 font-medium"
            >
              Delete Account
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SideIcons;
