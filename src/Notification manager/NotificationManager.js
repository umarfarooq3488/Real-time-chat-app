// import { messaging } from "@/config/firebase";
// import { getToken } from "firebase/messaging";
// import { onMessage } from "firebase/messaging";

// export const getNotificationPermission = async () => {
//   const vapidKey = "BPlLjDcqUTkHZSf-lJglp9KPLWmmDSZ_2kSD893SSOTBHtt0BAx-Ge4uFSOPMXwTFtqY4iK0zC8ckdmGC5Cl0fM";

//   try {
//     const token = getToken(messaging, { vapidKey })
//     if (token) {
//       console.log("Fcm token", token)
//     } else {
//       console.log("No FCM token is available")
//     }
//   } catch (error) {
//     console.error("An error occurred while getting FCM token", error)
//   }

// }
// export const listenForMessages = () => {
//   onMessage(messaging, (payload) => {
//     console.log('Message received. ', payload);
//     // Optionally show a notification or update UI here
//   });
// };