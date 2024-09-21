const createConversationId = (userAId, userBId) => {
    return [userAId, userBId].sort().join("_");
};

export default createConversationId;