import React, { useMemo, useState } from "react";
import PeopleList from "./PeopleList";

const PeopleModal = ({ open, onClose, currentUser, users }) => {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.displayName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, query]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose}></div>
      <div className="relative z-[101] w-[92vw] max-w-3xl h-[80vh] rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800">
            <div className="text-lg font-semibold">People</div>
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 transition-colors">
              Close
            </button>
          </div>
          <div className="sticky top-[53px] z-10 px-4 py-2 bg-white/95 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people by name or email..."
                className="w-full pl-10 pr-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 outline-none border border-gray-300 dark:border-gray-700 focus:border-blue-500 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"></path></svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <PeopleList currentUser={currentUser} users={filteredUsers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleModal; 