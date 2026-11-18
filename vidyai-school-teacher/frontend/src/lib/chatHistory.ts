// VidyAI Chat History & Session Management Engine
// Storage Key: vidyai_chat_sessions_v1
// Pure state manager decoupled from DOM manipulation (zero innerHTML / getElementById)

import { ChatMessage } from './api';

export interface ChatSession {
  id: string;
  title: string;
  standard: string;
  subject: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export const CHAT_STORAGE_KEY = 'vidyai_chat_sessions_v1';

export class VidyAIChatHistory {
  storageKey: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoadSession?: (session: ChatSession) => void;
  onNewSession?: (session: ChatSession | null) => void;

  constructor(options: {
    onLoadSession?: (session: ChatSession) => void;
    onNewSession?: (session: ChatSession | null) => void;
  } = {}) {
    this.storageKey = CHAT_STORAGE_KEY;
    this.sessions = this.loadFromStorage();
    this.activeSessionId = this.sessions[0]?.id || null;
    this.onLoadSession = options.onLoadSession;
    this.onNewSession = options.onNewSession;
  }

  loadFromStorage(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load chat history:', e);
      return [];
    }
  }

  saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }

  // Call this when "+ New Conversation" (or Cmd+K) is clicked
  startNewConversation(standard: string = 'Standard 4', subject: string = 'English (First Language)'): ChatSession {
    const newSession: ChatSession = {
      id: 'chat_' + Date.now(),
      title: 'New Conversation',
      standard,
      subject,
      updatedAt: new Date().toISOString(),
      messages: []
    };

    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.saveToStorage();

    if (this.onNewSession) this.onNewSession(newSession);
    return newSession;
  }

  // Call this whenever a user or AI sends a message
  addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    currentStandard: string = 'Standard 4',
    currentSubject: string = 'English',
    extraProps: Partial<ChatMessage> = {}
  ): ChatSession {
    let session = this.sessions.find(s => s.id === this.activeSessionId);

    // Auto-create session if none is active
    if (!session) {
      session = this.startNewConversation(currentStandard, currentSubject);
    }

    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
      ...extraProps
    });

    // Auto-generate title from the first user prompt
    if (role === 'user' && (session.title === 'New Conversation' || !session.title)) {
      session.title = content.length > 32 ? content.substring(0, 32) + '...' : content;
    }

    session.updatedAt = new Date().toISOString();

    // Move active session to the top of the list
    this.sessions = [
      session,
      ...this.sessions.filter(s => s.id !== session.id)
    ];

    this.saveToStorage();
    return session;
  }

  selectSession(sessionId: string): ChatSession | undefined {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return undefined;

    this.activeSessionId = sessionId;

    if (this.onLoadSession) {
      this.onLoadSession(session);
    }
    return session;
  }

  deleteSession(sessionId: string, event?: any) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    this.sessions = this.sessions.filter(s => s.id !== sessionId);

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions[0]?.id || null;
      if (this.activeSessionId && this.onLoadSession && this.sessions[0]) {
        this.onLoadSession(this.sessions[0]);
      } else if (this.onNewSession) {
        this.onNewSession(null);
      }
    }
    this.saveToStorage();
  }

  clearAllHistory() {
    if (typeof window !== 'undefined' && !window.confirm('Clear all saved chat conversations?')) return;
    this.sessions = [];
    this.activeSessionId = null;
    this.saveToStorage();
    if (this.onNewSession) this.onNewSession(null);
  }
}
