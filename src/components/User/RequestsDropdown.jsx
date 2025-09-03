import React, { useEffect, useMemo, useState } from "react";
import { auth, dataBase } from "@/config/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const RequestsDropdown = () => {
  const currentUid = auth.currentUser?.uid;
  const [me, setMe] = useState(null);
  const [userMap, setUserMap] = useState({}); // uid -> user data

  // Subscribe to my user doc to get pending lists
  useEffect(() => {
    if (!currentUid) return;
    const ref = doc(dataBase, "Users", currentUid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setMe({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [currentUid]);

  const incoming = useMemo(() => me?.pendingIncoming || [], [me]);
  const outgoing = useMemo(() => me?.pendingOutgoing || [], [me]);

  // Subscribe to user docs for incoming/outgoing to show names/avatars
  useEffect(() => {
    const uids = Array.from(new Set([...(incoming || []), ...(outgoing || [])]));
    const unsubs = [];
    uids.forEach((uid) => {
      const ref = doc(dataBase, "Users", uid);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setUserMap((prev) => ({ ...prev, [uid]: { id: snap.id, ...snap.data() } }));
        }
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach((u) => u());
  }, [incoming, outgoing]);

  const accept = async (fromUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", fromUid);
    await updateDoc(meRef, { pendingIncoming: arrayRemove(fromUid), connections: arrayUnion(fromUid) });
    await updateDoc(themRef, { pendingOutgoing: arrayRemove(currentUid), connections: arrayUnion(currentUid) });
  };

  const reject = async (fromUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", fromUid);
    await updateDoc(meRef, { pendingIncoming: arrayRemove(fromUid) });
    await updateDoc(themRef, { pendingOutgoing: arrayRemove(currentUid) });
  };

  const cancel = async (targetUid) => {
    if (!currentUid) return;
    const meRef = doc(dataBase, "Users", currentUid);
    const themRef = doc(dataBase, "Users", targetUid);
    await updateDoc(meRef, { pendingOutgoing: arrayRemove(targetUid) });
    await updateDoc(themRef, { pendingIncoming: arrayRemove(currentUid) });
  };

  const incomingCount = incoming.length;

  const renderUserRow = (uid, actions) => {
    const u = userMap[uid];
    return (
      <div key={uid} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
        <div className="flex items-center gap-2">
          <img src={u?.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-800 dark:text-gray-100">{u?.displayName || uid}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">{u?.email || ""}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {actions}
        </div>
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2a7 7 0 00-7 7v3.586l-.707.707A1 1 0 005 15h14a1 1 0 00.707-1.707L19 12.586V9a7 7 0 00-7-7z" />
            <path d="M9 18a3 3 0 006 0H9z" />
          </svg>
          {incomingCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[10px] min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white">
              {incomingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="text-sm font-semibold mb-2">Connection Requests</div>
        <div className="max-h-80 overflow-auto">
          <div className="mb-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Incoming</div>
            {incoming.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">No incoming requests</div>
            ) : (
              incoming.map((uid) =>
                renderUserRow(
                  uid,
                  <>
                    <button onClick={() => accept(uid)} className="px-2 py-0.5 text-xs rounded bg-teal-600 text-white hover:bg-teal-700">Accept</button>
                    <button onClick={() => reject(uid)} className="px-2 py-0.5 text-xs rounded bg-gray-400 text-white hover:bg-gray-500">Reject</button>
                  </>
                )
              )
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Outgoing</div>
            {outgoing.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400">No outgoing requests</div>
            ) : (
              outgoing.map((uid) =>
                renderUserRow(
                  uid,
                  <>
                    <button onClick={() => cancel(uid)} className="px-2 py-0.5 text-xs rounded bg-gray-400 text-white hover:bg-gray-500">Cancel</button>
                  </>
                )
              )
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RequestsDropdown; 