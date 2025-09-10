const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:8000';

export async function callExplainBot({ message, groupId, userId, username, context = [] }) {
    const res = await fetch(`${BOT_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            group_id: groupId,
            user_id: userId,
            username,
            context: Array.isArray(context) ? context.slice(-10) : []
        })
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Bot API error: ${res.status} ${detail}`);
    }

    return res.json(); // { response, bot_name, timestamp, group_id, user_id, username }
}

export async function callHelpBot({ message, groupId, userId, username, context = [] }) {
    // Uses same /chat, but expects the message to contain @help which backend routes to RAG
    return callExplainBot({ message, groupId, userId, username, context });
}