
export const formatDate = (timestamp) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
}

export const formatTime = (timestamp) => {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}