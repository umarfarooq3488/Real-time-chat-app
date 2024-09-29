// src/services/notificationService.js

const sendNotification = async (userId, message) => {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic YWI3YzU5ODUtNDMxYi00ODY0LTk2ODMtNmVlY2Y4ZTQyMzZj', // Replace with your REST API key
        },
        body: JSON.stringify({
            app_id: "01163343-b315-4598-a898-5cbd1e421eac", // Replace with your OneSignal App ID
            contents: { "en": message }, // Message content
            include_player_ids: [userId], // The userId from OneSignal SDK
        }),
    });

    const data = await response.json();
    console.log(data);
};

export default sendNotification;
