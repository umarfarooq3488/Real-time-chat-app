import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const User = ({ user, setShowSideBar, isActive }) => {
  const navigate = useNavigate();
  const selectUser = () => {
    navigate(`/dm/${user.UserId}`);
    setShowSideBar(false);
  };
  console.log(user.photoUrl);
  return (
    <div>
      <div
        onClick={selectUser}
        className={`flex gap-3 p-4 rounded-md transition-colors duration-200 cursor-pointer
          ${
            isActive
              ? "bg-teal-600 dark:bg-teal-800 text-white"
              : "hover:bg-gray-200 dark:hover:bg-gray-600 bg-gray-100 dark:bg-gray-800"
          }`}
      >
        <img
          src={user.photoUrl}
          className="rounded-full w-12 h-12 object-cover"
          alt=""
        />
        <div className="info flex flex-col justify-center">
          <h3
            className={`font-bold text-lg ${
              isActive ? "text-white" : "text-gray-800 dark:text-gray-100"
            }`}
          >
            {user.displayName}
          </h3>
          <p
            className={`text-sm text-nowrap ${
              isActive ? "text-gray-100" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Message to {user.displayName}
          </p>
        </div>
      </div>
    </div>
  );
};

export default User;
