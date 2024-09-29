import React from "react";
import { useUser } from "../../context/UserContext";

const User = ({ user, setShowSideBar }) => {
  const { setChatType, setSelectedUserId } = useUser();
  const selectUser = () => {
    setChatType("private");
    setSelectedUserId(user.userId);
    setShowSideBar(false);
  };
  return (
    <div>
      <div
        onClick={selectUser}
        className="box flex overflow-hidden gap-3 dark:text-gray-300 dark:hover:bg-gray-600 text-gray-600 cursor-pointer dark:bg-gray-700 hover:bg-[#c4c4c4] rounded-md bg-gray-300 p-4"
      >
        <img src={user.photoUrl} className="rounded-full w-12" alt="" />
        <div className="info flex flex-col">
          <h3 className="font-bold text-lg dark:text-teal-400">
            {user.displayName}
          </h3>
          <p className="text-sm text-nowrap">Message to {user.displayName}</p>
        </div>
      </div>
    </div>
  );
};

export default User;
