import { useEffect, useState, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { GameState, ChatMessage, BetResultNotification } from '../types/index';
import api from '../services/api';

const WS_URL = 'https://api.letmeclean.pl/ws/game';

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [betResults, setBetResults] = useState<BetResultNotification | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await api.getChatHistory(50);
        setChatMessages(history);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    };
    loadChatHistory();
  }, []);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connected');

        // Game state updates
        client.subscribe('/topic/game', (message) => {
          try {
            const state = JSON.parse(message.body) as GameState;
            setGameState(state);
          } catch (e) {
            console.error('Failed to parse game state:', e);
          }
        });

        // Chat messages
        client.subscribe('/topic/chat', (message) => {
          try {
            const chatMsg = JSON.parse(message.body) as ChatMessage;
            setChatMessages(prev => [...prev.slice(-99), chatMsg]); // Keep last 100
          } catch (e) {
            console.error('Failed to parse chat message:', e);
          }
        });

        // Personal bet results (requires auth)
        client.subscribe('/user/queue/bet-results', (message) => {
          try {
            const results = JSON.parse(message.body) as BetResultNotification;
            setBetResults(results);
          } catch (e) {
            console.error('Failed to parse bet results:', e);
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
        console.log('WebSocket disconnected');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setError(frame.headers['message'] || 'Connection error');
        setConnected(false);
      },
      onWebSocketError: () => {
        setError('WebSocket connection failed');
        setConnected(false);
      }
    });

    clientRef.current = client;
    client.activate();
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setConnected(false);
  }, []);

  const clearBetResults = useCallback(() => {
    setBetResults(null);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { 
    gameState, 
    chatMessages,
    betResults,
    clearBetResults,
    connected, 
    error, 
    reconnect: connect 
  };
}

export default useGameSocket;
