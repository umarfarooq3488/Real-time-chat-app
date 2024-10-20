import React, { useState, useEffect } from "react";
import User from "./User";
import SideIcons from "./SideIcons";
import { dataBase } from "../../config/firebase";
import Groupdp from "../GroupDp.png";
import { useUser } from "../../context/UserContext";
import {
  collection,
  onSnapshot,
  orderBy,
  limit,
  query,
} from "firebase/firestore";

const User_sidebar = ({ setShowSideBar }) => {
  const [user, setUser] = useState([]);
  const { setChatType } = useUser();

  useEffect(() => {
    const q = query(
      collection(dataBase, "Users"),
      orderBy("userId", "asc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchUsers = snapshot.docs.map((doc) => {
        return {
          UserId: doc.id,
          ...doc.data(),
        };
      });
      setUser(fetchUsers);
    });
    return () => unsubscribe();
  }, []);

  const selectGroup = () => {
    setChatType("group");
    setShowSideBar(false);
  };
  return (
    <div className="h-[90vh] z-50 overflow-auto duration-500 w-[87%] md:w-[100%] transition-all bg-gray-200 text-gray-600 dark:bg-gray-900 dark:text-teal-400 md:h-[90vh] md:relative absolute">
      <div className=" cursor-pointer h-full border-r-4 p-3 border-gray-400">
        <div className="box flex flex-col">
          <div className="top text-xl font-bold p-3">Chats</div>
          <div className="users flex flex-col gap-1">
            <div>
              <div
                onClick={selectGroup}
                className="box overflow-hidden flex gap-3 dark:hover:bg-gray-600 hover:bg-[#c4c4c4] rounded-md dark:bg-gray-700 bg-gray-300 p-4"
              >
                <img src={Groupdp} className="rounded-full w-10" alt="" />
                <div className="info flex flex-col">
                  <h3 className="font-bold text-lg">Public Group</h3>
                  <p className="text-sm text-nowrap dark:text-gray-300">
                    Anyone can see you messages
                  </p>
                </div>
              </div>
            </div>
            {user &&
              user.map((item) => (
                <User
                  setShowSideBar={setShowSideBar}
                  key={item.UserId}
                  user={item}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default User_sidebar;
