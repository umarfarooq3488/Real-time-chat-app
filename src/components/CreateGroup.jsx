import React, { useState } from "react";
import { auth, dataBase } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { X, Users, Lock, Globe, Settings, Plus } from "lucide-react";
import { addUserToGroup } from "../lib/groupUtils";

const CreateGroup = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    aiExplainLimitPerDay: 20,
    allowSummarize: true,
    ragEnabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { displayName, uid, photoURL } = auth.currentUser;
      
      if (!formData.name.trim()) {
        throw new Error("Group name is required");
      }

      if (!formData.description.trim()) {
        throw new Error("Group description is required");
      }

      // Create the group document
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdBy: uid,
        createdAt: serverTimestamp(),
        visibility: formData.visibility,
        roles: {
          [uid]: "admin" // Creator becomes admin
        },
        members: [uid], // Array of user IDs who are members
        membersCount: 1, // Creator is the first member
        notesContext: [], // Empty initially
        settings: {
          aiExplainLimitPerDay: parseInt(formData.aiExplainLimitPerDay),
          allowSummarize: formData.allowSummarize,
          ragEnabled: formData.ragEnabled,
        },
        aiUsage: {
          explainCallsToday: 0,
          notesCallsToday: 0,
          dateKey: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        }
      };

      const docRef = await addDoc(collection(dataBase, "groups"), groupData);

      // Ensure the creator is recorded in their own groupsJoined as admin
      await addUserToGroup(docRef.id, uid, "admin");
      
      // Navigate to the newly created group
      navigate(`/chat/${docRef.id}`);
      onClose();
      
    } catch (error) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter group name"
              maxLength={50}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Describe your group"
              maxLength={200}
              required
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === "public"}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Globe size={16} className="text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Public - Anyone can join</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === "private"}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <Lock size={16} className="text-red-600" />
                <span className="text-gray-700 dark:text-gray-300">Private - Invite only</span>
              </label>
            </div>
          </div>

          {/* AI Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings size={20} className="mr-2" />
              AI Settings
            </h3>
            
            {/* AI Explain Limit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Explain Limit Per Day
              </label>
              <input
                type="number"
                name="aiExplainLimitPerDay"
                value={formData.aiExplainLimitPerDay}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* AI Features */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowSummarize"
                  checked={formData.allowSummarize}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Allow message summarization</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="ragEnabled"
                  checked={formData.ragEnabled}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Enable RAG (Retrieval-Augmented Generation)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup; 