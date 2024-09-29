/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Function to send notifications for group messages (Messages collection)
exports.sendGroupMessageNotification = functions.firestore
    .document('Messages/{messageId}')
    .onCreate(async (snap, context) => {
        const messageData = snap.data();
        const { senderId, messageText } = messageData;

        // Retrieve FCM tokens of all users except the sender
        const usersSnapshot = await admin.firestore().collection('Users').get();
        const tokens = [];

        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            if (userData.uid !== senderId && userData.fcmToken) {
                tokens.push(userData.fcmToken);
            }
        });

        if (tokens.length === 0) {
            console.log('No tokens found for group message.');
            return null;
        }

        const payload = {
            notification: {
                title: "New group message",
                body: messageText,
                clickAction: "FLUTTER_NOTIFICATION_CLICK",
            },
        };

        try {
            await admin.messaging().sendToDevice(tokens, payload);
            console.log('Group notification sent successfully.');
        } catch (error) {
            console.error('Error sending group notification:', error);
        }

        return null;
    });

// Function to send notifications for private messages (privateMessages subcollections)
exports.sendPrivateMessageNotification = functions.firestore
    .document('privateMessages/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const messageData = snap.data();
        const { senderId, receiverId, messageText } = messageData;

        // Retrieve the FCM token of the receiver
        const userDoc = await admin.firestore().collection('Users').doc(receiverId).get();
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;

        if (!fcmToken) {
            console.log('No FCM token for private message recipient:', receiverId);
            return null;
        }

        const payload = {
            notification: {
                title: "New private message",
                body: messageText,
                clickAction: "FLUTTER_NOTIFICATION_CLICK",
            },
        };

        try {
            await admin.messaging().sendToDevice(fcmToken, payload);
            console.log('Private message notification sent successfully.');
        } catch (error) {
            console.error('Error sending private message notification:', error);
        }

        return null;
    });
