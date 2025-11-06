import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  MessageSquare,
  LogOut,
  BarChart3,
  Archive,
  Trash2,
  ArchiveRestore,
  Bookmark,
} from "lucide-react";
import { conversationAPI } from "../api/client";
import type { Conversation } from "../api/client";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { authAPI } from "../api/auth";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { toast } from "sonner";

export type SidebarPage = "chat" | "intelligence" | "analytics" | "bookmarks";

interface SidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
  onShowIntelligence: () => void;
  refreshTrigger?: number;
  onLogout?: () => void;
  currentPage?: SidebarPage;
}

export default function Sidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onShowIntelligence,
  refreshTrigger = 0,
  onLogout,
  currentPage = "chat",
}: SidebarProps) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [username, setUsername] = useState<string>("");

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onLogout?.();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await conversationAPI.getAllConversations(showArchived);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsername = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setUsername(user.username || "");
    } catch (error) {
      console.error("Failed to load username:", error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const result = await conversationAPI.archiveConversation(conversationId);
      toast.success(result.is_archived ? "Chat archived" : "Chat unarchived");
      await loadConversations();
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      toast.error("Failed to archive chat");
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await conversationAPI.deleteConversation(conversationId);
      toast.success("Chat deleted");
      if (currentConversationId === conversationId) {
        onNewConversation();
      }
      await loadConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete chat");
    }
  };

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger, showArchived]);

  useEffect(() => {
    loadUsername();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNavButtonProps = (page: SidebarPage) => {
    const isActive = currentPage === page;
    return {
      variant: isActive ? ("default" as const) : ("secondary" as const),
      className: cn(
        "w-full justify-start rounded-lg px-4 py-2.5 font-medium",
        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
      ),
    };
  };

  return (
    <aside className="w-64 min-w-64 bg-background border-r border-border flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">RecallAI</h1>
        </div>
        <AnimatedThemeToggler />
      </div>

      <div className="p-4 space-y-2">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start rounded-lg px-4 py-2.5 font-medium"
        >
          <Plus className="mr-3 h-4 w-4" />
          New chat
        </Button>

        <Button
          onClick={onShowIntelligence}
          {...getNavButtonProps("intelligence")}
        >
          <Sparkles className="mr-3 h-4 w-4" />
          Intelligence
        </Button>

        <Button
          onClick={() => navigate("/analytics")}
          {...getNavButtonProps("analytics")}
        >
          <BarChart3 className="mr-3 h-4 w-4" />
          Analytics
        </Button>

        <Button
          onClick={() => navigate("/bookmarks")}
          {...getNavButtonProps("bookmarks")}
        >
          <Bookmark className="mr-3 h-4 w-4" />
          Bookmarks
        </Button>
      </div>

      <div className="px-4">
        <div className="h-px bg-border" />
      </div>

      <div className="flex items-center justify-between px-4 py-3 mt-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {showArchived ? "Archived chats" : "Recent chats"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="h-6 px-2 text-xs"
        >
          {showArchived ? (
            <MessageSquare className="h-3 w-3" />
          ) : (
            <Archive className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="animate-spin">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-2 gap-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground text-center">
              No conversations yet
              <br />
              <span className="text-xs">Start a new chat to begin</span>
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const active = currentConversationId === conv.id;
            return (
              <ContextMenu key={conv.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      active
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">
                          {conv.title || "Untitled chat"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {formatDate(conv.start_time)} • {conv.status}
                        </p>
                      </div>
                      {active && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {conv.is_archived ? (
                    <ContextMenuItem
                      onClick={() => handleArchiveConversation(conv.id)}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Unarchive Chat
                    </ContextMenuItem>
                  ) : (
                    <ContextMenuItem
                      onClick={() => handleArchiveConversation(conv.id)}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Chat
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Chat
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        {username && (
          <div className="px-3 py-2 text-xs text-muted-foreground text-center bg-muted/50 rounded-lg">
            Logged in as{" "}
            <span className="font-medium text-foreground">{username}</span>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
