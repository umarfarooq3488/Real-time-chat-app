import React, { useMemo } from "react";
import { auth, dataBase } from "@/config/firebase";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";

const Requests = ({ currentUser }) => {
  const currentUid = auth.currentUser?.uid;
  const incoming = useMemo(() => currentUser?.pendingIncoming || [], [currentUser]);
  const outgoing = useMemo(() => currentUser?.pendingOutgoing || [], [currentUser]);

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

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="text-lg font-semibold px-3">Incoming</div>
        {incoming.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No incoming requests</div>
        ) : (
          <div className="flex flex-col gap-2 px-3 py-2">
            {incoming.map((uid) => (
              <div key={uid} className="flex items-center justify-between p-3 rounded bg-gray-100 dark:bg-gray-800">
                <div className="text-sm text-gray-700 dark:text-gray-200">{uid}</div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(uid)} className="px-2 py-1 text-xs rounded bg-teal-600 text-white hover:bg-teal-700">Accept</button>
                  <button onClick={() => rejectRequest(uid)} className="px-2 py-1 text-xs rounded bg-gray-400 text-white hover:bg-gray-500">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="text-lg font-semibold px-3">Outgoing</div>
        {outgoing.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No outgoing requests</div>
        ) : (
          <div className="flex flex-col gap-2 px-3 py-2">
            {outgoing.map((uid) => (
              <div key={uid} className="flex items-center justify-between p-3 rounded bg-gray-100 dark:bg-gray-800">
                <div className="text-sm text-gray-700 dark:text-gray-200">{uid}</div>
                <div>
                  <button onClick={() => cancelRequest(uid)} className="px-2 py-1 text-xs rounded bg-gray-400 text-white hover:bg-gray-500">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Requests; 