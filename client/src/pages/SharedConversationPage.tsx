import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { conversationAPI } from "../api/client";
import type { Conversation } from "../api/client";
import ChatMessage from "../components/ChatMessage";
import { Loader2 } from "lucide-react";

export default function SharedConversationPage() {
  const { token } = useParams<{ token: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSharedConversation(token);
    }
  }, [token]);

  const loadSharedConversation = async (shareToken: string) => {
    setIsLoading(true);
    try {
      const data = await conversationAPI.getSharedConversation(shareToken);
      setConversation(data);
    } catch {
      setError("Conversation not found or no longer shared");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Conversation Not Found</h2>
          <p className="text-muted-foreground">{error || "This conversation may have been deleted or is no longer shared."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border px-6 py-4 bg-background/95 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">{conversation.title}</h1>
        <p className="text-sm text-muted-foreground">Shared Conversation</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 py-8">
          <div className="space-y-6 max-w-5xl mx-auto">
            {conversation.messages?.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  } w-full`}
                >
                  <div
                    className={`max-w-2xl w-full ${
                      m.sender === "user" ? "flex justify-end" : ""
                    }`}
                  >
                    <ChatMessage role={m.sender} content={m.content} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
