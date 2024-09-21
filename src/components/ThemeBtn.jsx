import React from "react";
import { useTheme } from "../context/ThemeContext";
import { MdLightMode } from "react-icons/md";
import { BsFillMoonStarsFill } from "react-icons/bs";

const ThemeBtn = () => {
  const { themeMode, toggleTheme } = useTheme();
  return (
    <div>
      <button onClick={toggleTheme} className="outline-none">
        {themeMode !== "light" ? (
          <MdLightMode className="cursor-pointer text-3xl hover:rotate-180 transition duration-300" />
        ) : (
          <BsFillMoonStarsFill className="cursor-pointer pt-1 md:pt-0 text-2xl transition duration-300" />
        )}
      </button>
    </div>
  );
};

export default ThemeBtn;
