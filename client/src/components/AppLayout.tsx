import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import type { SidebarPage } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  currentConversationId?: string | null;
  onSelectConversation?: (id: string | null) => void;
  onNewConversation?: () => void;
  refreshTrigger?: number;
  onLogout?: () => void;
}

export default function AppLayout({
  children,
  currentConversationId = null,
  onSelectConversation,
  onNewConversation,
  refreshTrigger = 0,
  onLogout,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page from location
  const getCurrentPage = (): SidebarPage => {
    if (location.pathname.startsWith('/intelligence')) return 'intelligence';
    if (location.pathname.startsWith('/analytics')) return 'analytics';
    if (location.pathname.startsWith('/bookmarks')) return 'bookmarks';
    return 'chat';
  };

  const handleNewConversation = () => {
    if (onNewConversation) {
      onNewConversation();
    } else {
      navigate("/chats");
    }
  };

  const handleSelectConversation = (id: string | null) => {
    if (onSelectConversation) {
      onSelectConversation(id);
    } else {
      if (id) {
        navigate(`/chats/${id}`);
      } else {
        navigate("/chats");
      }
    }
  };

  const handleShowIntelligence = () => {
    navigate("/intelligence");
  };

  return (
    <div className="flex w-full h-full">
      <Sidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onShowIntelligence={handleShowIntelligence}
        refreshTrigger={refreshTrigger}
        onLogout={onLogout}
        currentPage={getCurrentPage()}
      />
      {children}
    </div>
  );
}
