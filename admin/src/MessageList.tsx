import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConversations, getConversationMessages, deleteMessage } from './storage';
import type { Conversation, Message } from './types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MessageList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getConversations().then(setConversations);
  }, []);

  async function handleExpand(convoId: string) {
    if (expandedId === convoId) {
      setExpandedId(null);
      setMessages([]);
      return;
    }
    setExpandedId(convoId);
    setLoadingMessages(true);
    const msgs = await getConversationMessages(convoId);
    setMessages(msgs);
    setLoadingMessages(false);
  }

  async function handleDeleteMessage(msgId: string) {
    if (!window.confirm('Delete this message permanently?')) return;
    await deleteMessage(msgId);
    setMessages(messages.filter(m => m.id !== msgId));
    // Update message count
    if (expandedId) {
      setConversations(prev =>
        prev.map(c =>
          c.id === expandedId ? { ...c, message_count: c.message_count - 1 } : c,
        ),
      );
    }
  }

  const filtered = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      c =>
        (c.user1_name ?? '').toLowerCase().includes(q) ||
        (c.user2_name ?? '').toLowerCase().includes(q) ||
        (c.last_message ?? '').toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search by participant name or message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Participants</th>
              <th>Messages</th>
              <th>Last Message</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <>
                <tr key={c.id}>
                  <td>
                    <Link to={`/users/${c.user1_id}`} className="link">
                      {c.user1_name}
                    </Link>
                    {' & '}
                    <Link to={`/users/${c.user2_id}`} className="link">
                      {c.user2_name}
                    </Link>
                  </td>
                  <td>{c.message_count}</td>
                  <td>
                    <span className="truncate" style={{ display: 'inline-block', maxWidth: 250 }}>
                      {c.last_message
                        ? c.last_message.length > 60
                          ? c.last_message.slice(0, 60) + '...'
                          : c.last_message
                        : '—'}
                    </span>
                  </td>
                  <td>{c.last_message_at ? formatDate(c.last_message_at) : '—'}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleExpand(c.id)}
                    >
                      {expandedId === c.id ? 'Collapse' : 'View Messages'}
                    </button>
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-messages`}>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div style={{ padding: '12px 24px', backgroundColor: '#f9f9f9' }}>
                        {loadingMessages ? (
                          <div className="empty-state">Loading messages...</div>
                        ) : messages.length === 0 ? (
                          <div className="empty-state">No messages in this conversation</div>
                        ) : (
                          <table style={{ marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th>Sender</th>
                                <th>Message</th>
                                <th>Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {messages.map(m => (
                                <tr key={m.id}>
                                  <td>
                                    <Link to={`/users/${m.user_id}`} className="link">
                                      {m.author_name ?? m.user_id.slice(0, 8)}
                                    </Link>
                                  </td>
                                  <td>{m.content}</td>
                                  <td style={{ whiteSpace: 'nowrap' }}>{formatTime(m.created_at)}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleDeleteMessage(m.id)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state">No conversations found</div>}
      </div>
    </div>
  );
}
