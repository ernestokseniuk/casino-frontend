import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage } from '../types/index';
import api from '../services/api';
import './Chat.css';

interface ChatProps {
  messages: ChatMessage[];
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

export function Chat({ messages, isAuthenticated, onLoginClick }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      await api.sendChatMessage(inputMessage.trim());
      setInputMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="chat-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="chat-title">💬 Live Chat</span>
        <span className="chat-toggle">{isExpanded ? '▼' : '▲'}</span>
      </div>

      {isExpanded && (
        <>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">No messages yet. Be the first to chat!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <span className="chat-time">{formatTime(msg.createdAt)}</span>
                  <span className="chat-username">{msg.username}:</span>
                  <span className="chat-text">{msg.message}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="chat-error">{error}</div>}

          {isAuthenticated ? (
            <form className="chat-input-form" onSubmit={handleSend}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                disabled={sending}
              />
              <button type="submit" disabled={sending || !inputMessage.trim()}>
                {sending ? '...' : '➤'}
              </button>
            </form>
          ) : (
            <div className="chat-login-prompt">
              <button onClick={onLoginClick}>Sign in to chat</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Chat;
