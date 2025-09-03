import express from "express";
import admin from "firebase-admin";

const app = express();

// Correct path: serviceAccountKey.json is in the same folder as server.js
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.get("/getUserEmail", async (req, res) => {
    const uid = req.query.uid;

    try {
        const userRecord = await admin.auth().getUser(uid);
        res.json({ email: userRecord.email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3001, () => {
    console.log("Backend running on http://localhost:3001");
});
