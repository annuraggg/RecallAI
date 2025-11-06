import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import ChatWindow from "../components/ChatWindow";

interface ChatPageProps {
  onLogout?: () => void;
}

export default function ChatPage({ onLogout }: ChatPageProps) {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(conversationId ?? null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId]);

  const handleNewConversation = () => {
    navigate("/chats");
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (id: string | null) => {
    if (id) {
      navigate(`/chats/${id}`);
    } else {
      navigate("/chats");
    }
    setCurrentConversationId(id);
  };

  const handleConversationCreated = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`);
      setCurrentConversationId(id);
      setRefreshTrigger((prev) => prev + 1);
    },
    [navigate]
  );

  const handleConversationEnded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    navigate("/chats");
    setCurrentConversationId(null);
  }, [navigate]);

  return (
    <AppLayout
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onNewConversation={handleNewConversation}
      refreshTrigger={refreshTrigger}
      onLogout={onLogout}
    >
      <ChatWindow
        key="chat-window"
        conversationId={currentConversationId}
        onConversationCreated={handleConversationCreated}
        onConversationEnded={handleConversationEnded}
      />
    </AppLayout>
  );
}
