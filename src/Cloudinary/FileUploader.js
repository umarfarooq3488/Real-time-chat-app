import axios from "axios";

export const FileUploader = async (file) => {
    if (!file) return null;

    const CLOUD_NAME = "dva0cameb"; // Consider moving this to .env
    const UPLOAD_PRESET = "chat_upload";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'chat_files');

    try {
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            formData
        );

        if (response.data && response.data.secure_url) {
            console.log("File uploaded successfully to cloudinary");
            return response.data.secure_url;
        }
        throw new Error('Upload failed - no URL received');

    } catch (error) {
        console.error("Error uploading file:", error.response?.data || error.message);
        return null;
    }
};

