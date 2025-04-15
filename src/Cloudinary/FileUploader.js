import axios from "axios";

export const FileUploader = async (file) => {
    if (!file) return null;

    const CLOUD_NAME = import.meta.env.CLOUD_NAME;
    const UPLOAD_PRESET = "chat_upload";

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'chat_files');
    formData.append('resource_type', 'raw'); // Change to 'raw' for PDFs

    try {
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
            formData
        );

        if (response.data && response.data.secure_url) {
            // Add fl_attachment flag for PDFs
            let url = response.data.secure_url;
            if (file.type === 'application/pdf') {
                url = url.replace('/upload/', '/upload/fl_attachment/');
            }
            return url;
        }
        throw new Error('Upload failed - no URL received');

    } catch (error) {
        console.error("Error uploading file:", error.response?.data || error.message);
        return null;
    }
};

