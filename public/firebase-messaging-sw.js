// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

// // Initialize the Firebase app in the service worker
// const firebaseConfig = {
//     apiKey: "AIzaSyA44NdvoI8MzaRJAZeVc5TjdhMyzii7riw",
//     authDomain: "my-chat-app-871bb.firebaseapp.com",
//     projectId: "my-chat-app-871bb",
//     storageBucket: "my-chat-app-871bb.appspot.com",
//     messagingSenderId: "628850930970",
//     appId: "1:628850930970:web:4889a95f19e76941e768a3",
//     measurementId: "G-KPEJ14VVLZ"
// };

// firebase.initializeApp(firebaseConfig);

// const messaging = firebase.messaging();

// // Handle background messages
// messaging.onBackgroundMessage((payload) => {
//     console.log('Received background message ', payload);

//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//         body: payload.notification.body,
//         icon: payload.notification.icon
//     };

//     return self.registration.showNotification(notificationTitle, notificationOptions);
// });
