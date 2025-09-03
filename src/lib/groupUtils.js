import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from "firebase/firestore";
import { dataBase } from "../config/firebase";

/**
 * Add a user to a group
 * @param {string} groupId - The group ID
 * @param {string} userId - The user ID to add
 * @param {string} role - The role to assign (default: "member")
 * @returns {Promise<void>}
 */
export const addUserToGroup = async (groupId, userId, role = "member") => {
    try {
        const groupRef = doc(dataBase, "groups", groupId);

        // Add user to group's members array and roles
        await updateDoc(groupRef, {
            members: arrayUnion(userId),
            [`roles.${userId}`]: role
        });

        // Update user's groupsJoined array - ensure user document exists
        const userRef = doc(dataBase, "Users", userId);

        // First check if user document exists
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // User document exists, update it
            await updateDoc(userRef, {
                groupsJoined: arrayUnion(groupId)
            });
        } else {
            // User document doesn't exist, create it with the group
            await setDoc(userRef, {
                groupsJoined: [groupId]
            }, { merge: true });
        }

        console.log(`User ${userId} added to group ${groupId} as ${role}`);
    } catch (error) {
        console.error("Error adding user to group:", error);
        throw error;
    }
};

/**
 * Remove a user from a group
 * @param {string} groupId - The user ID to remove
 * @param {string} userId - The user ID to remove
 * @returns {Promise<void>}
 */
export const removeUserFromGroup = async (groupId, userId) => {
    try {
        const groupRef = doc(dataBase, "groups", groupId);

        // Remove user from group's members array and roles
        await updateDoc(groupRef, {
            members: arrayRemove(userId),
            [`roles.${userId}`]: null
        });

        // Remove group from user's groupsJoined array
        const userRef = doc(dataBase, "Users", userId);
        await updateDoc(userRef, {
            groupsJoined: arrayRemove(groupId)
        });

        console.log(`User ${userId} removed from group ${groupId}`);
    } catch (error) {
        console.error("Error removing user from group:", error);
        throw error;
    }
};

/**
 * Get the actual member count from a group
 * @param {Object} group - The group document data
 * @returns {number} - The actual member count
 */
export const getActualMemberCount = (group) => {
    if (group.members && Array.isArray(group.members)) {
        return group.members.length;
    }
    return group.membersCount || 0;
};

/**
 * Check if a user is a member of a group
 * @param {Object} group - The group document data
 * @param {string} userId - The user ID to check
 * @returns {boolean} - True if user is a member
 */
export const isUserMemberOfGroup = (group, userId) => {
    if (group.members && Array.isArray(group.members)) {
        return group.members.includes(userId);
    }
    return false;
};

/**
 * Get user's role in a group
 * @param {Object} group - The group document data
 * @param {string} userId - The user ID
 * @returns {string|null} - The user's role or null if not found
 */
export const getUserRoleInGroup = (group, userId) => {
    if (group.roles && group.roles[userId]) {
        return group.roles[userId];
    }
    return null;
};

/**
 * Check if user has admin permissions in a group
 * @param {string} groupId - The group ID
 * @param {string} userId - The user ID
 * @returns {boolean} - True if user is admin
 */
export const isUserAdminInGroup = (group, userId) => {
    const role = getUserRoleInGroup(group, userId);
    return role === "admin";
};

/**
 * Check if user has moderator permissions in a group
 * @param {Object} group - The group document data
 * @param {string} userId - The user ID
 * @returns {boolean} - True if user is admin or moderator
 */
export const isUserModeratorInGroup = (group, userId) => {
    const role = getUserRoleInGroup(group, userId);
    return role === "admin" || role === "mod";
}; 