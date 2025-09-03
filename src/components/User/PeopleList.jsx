import React, { useMemo, useCallback } from "react";
import { auth, dataBase } from "@/config/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const PeopleList = ({ currentUser, users }) => {
  const currentUid = auth.currentUser?.uid;

  const otherUsers = useMemo(
    () => users.filter((u) => u.userId && u.userId !== currentUid),
    [users, currentUid]
  );

  const isConnected = useCallback(
    (uid) => (currentUser?.connections || []).includes(uid),
    [currentUser]
  );

  const isIncoming = useCallback(
    (uid) => (currentUser?.pendingIncoming || []).includes(uid),
    [currentUser]
  );

  const isOutgoing = useCallback(
    (uid) => (currentUser?.pendingOutgoing || []).includes(uid),
    [currentUser]
  );

  const sendRequest = async (targetUid) => {
    if (!currentUid || currentUid === targetUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", targetUid);
    await updateDoc(meRef, { pendingOutgoing: arrayUnion(targetUid) });
    await updateDoc(themRef, { pendingIncoming: arrayUnion(currentUid) });
  };

  const acceptRequest = async (fromUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", fromUid);
    await updateDoc(meRef, {
      pendingIncoming: arrayRemove(fromUid),
      connections: arrayUnion(fromUid),
    });
    await updateDoc(themRef, {
      pendingOutgoing: arrayRemove(currentUid),
      connections: arrayUnion(currentUid),
    });
  };

  const rejectRequest = async (fromUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", fromUid);
    await updateDoc(meRef, { pendingIncoming: arrayRemove(fromUid) });
    await updateDoc(themRef, { pendingOutgoing: arrayRemove(currentUid) });
  };

  const cancelRequest = async (targetUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", targetUid);
    await updateDoc(meRef, { pendingOutgoing: arrayRemove(targetUid) });
    await updateDoc(themRef, { pendingIncoming: arrayRemove(currentUid) });
  };

  const removeConnection = async (targetUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", targetUid);
    await updateDoc(meRef, { connections: arrayRemove(targetUid) });
    await updateDoc(themRef, { connections: arrayRemove(currentUid) });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="top text-xl font-bold p-3 flex items-center justify-between">
        <span>People</span>
      </div>
      {otherUsers.map((u) => {
        const connected = isConnected(u.userId);
        const incoming = isIncoming(u.userId);
        const outgoing = isOutgoing(u.userId);
        return (
          <div
            key={u.UserId}
            className="flex items-center justify-between gap-3 p-3 rounded-md bg-gray-100 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <img src={u.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-800 dark:text-gray-100">{u.displayName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{u.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <span className="text-xs text-green-700 dark:text-green-400">Connected</span>
                  <button
                    onClick={() => removeConnection(u.userId)}
                    className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : incoming ? (
                <>
                  <button
                    onClick={() => acceptRequest(u.userId)}
                    className="px-2 py-1 text-xs rounded bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => rejectRequest(u.userId)}
                    className="px-2 py-1 text-xs rounded bg-gray-400 text-white hover:bg-gray-500"
                  >
                    Reject
                  </button>
                </>
              ) : outgoing ? (
                <>
                  <span className="text-xs text-yellow-700 dark:text-yellow-400">Pending</span>
                  <button
                    onClick={() => cancelRequest(u.userId)}
                    className="px-2 py-1 text-xs rounded bg-gray-400 text-white hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => sendRequest(u.userId)}
                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        );
      })}
      {otherUsers.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 p-4">No users found.</div>
      )}
    </div>
  );
};

export default PeopleList; 