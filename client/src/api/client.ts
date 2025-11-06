const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function getCSRFToken(): string {
  return getCookie('csrftoken') || '';
}

export interface Message {
  id?: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
  is_bookmarked?: boolean;
  reactions?: string[];
  parent?: number;
  branch_name?: string;
}

export interface Conversation {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  status: string;
  summary?: string;
  messages?: Message[];
  is_archived?: boolean;
}

export interface SendMessageResponse {
  user_message: string;
  ai_response: string;
}

export interface EndConversationResponse {
  message: string;
  summary: string;
}

export interface QueryResponse {
  query: string;
  response: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export const conversationAPI = {
  async getAllConversations(showArchived: boolean = false): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (showArchived) {
      params.append('show_archived', 'true');
    }
    const response = await fetch(`${API_BASE_URL}/conversations/?${params}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  },

  async createConversation(title: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ title, status: 'active' }),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  },

  async sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/send_message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async endConversation(conversationId: string): Promise<EndConversationResponse> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/end/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to end conversation');
    return response.json();
  },

  async queryConversations(query: string): Promise<QueryResponse> {
    const response = await fetch(`${API_BASE_URL}/conversations/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error('Failed to query conversations');
    return response.json();
  },

  async getSuggestions(conversationId: string): Promise<SuggestionsResponse> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/suggestions/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get suggestions');
    return response.json();
  },

  async exportConversation(conversationId: string, format: 'json' | 'pdf' | 'markdown'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/export/?format=${format}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to export conversation');
    return response.blob();
  },

  async archiveConversation(conversationId: string): Promise<{ is_archived: boolean }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/archive/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to archive conversation');
    return response.json();
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete conversation');
  },

  async shareConversation(conversationId: string): Promise<{ share_token: string; share_url: string }> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/share/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to share conversation');
    return response.json();
  },

  async getSharedConversation(token: string): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/shared/${token}/`);
    if (!response.ok) throw new Error('Failed to get shared conversation');
    return response.json();
  },

  async getAnalytics(): Promise<{
    total_conversations: number;
    total_messages: number;
    active_conversations: number;
    ended_conversations: number;
    archived_conversations: number;
    avg_messages_per_conversation: number;
    conversations_last_7_days: number;
    conversations_last_30_days: number;
    messages_last_7_days: number;
    bookmarked_messages_count: number;
    user_message_count: number;
    ai_message_count: number;
    conversations_with_summaries: number;
    conversations_by_date: Array<{ date: string; count: number }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/conversations/analytics/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get analytics');
    return response.json();
  },
};

export const messageAPI = {
  async bookmarkMessage(messageId: number): Promise<{ is_bookmarked: boolean }> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/bookmark/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to bookmark message');
    return response.json();
  },

  async reactToMessage(messageId: number, reaction: string): Promise<{ reactions: string[] }> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/react/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ reaction }),
    });
    if (!response.ok) throw new Error('Failed to react to message');
    return response.json();
  },

  async branchMessage(messageId: number, content: string, branchName?: string): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/branch/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
      credentials: 'include',
      body: JSON.stringify({ content, branch_name: branchName }),
    });
    if (!response.ok) throw new Error('Failed to branch message');
    return response.json();
  },

  async getBranches(messageId: number): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/get_branches/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get branches');
    return response.json();
  },

  async getBookmarkedMessages(): Promise<Message[]> {
    const response = await fetch(`${API_BASE_URL}/messages/bookmarked/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to get bookmarked messages');
    return response.json();
  },
};
