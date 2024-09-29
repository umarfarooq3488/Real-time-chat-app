// onesignal-sw.js

importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Optional: Customize behavior of notifications here
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://yourwebsite.com') // Adjust the URL
    );
});
