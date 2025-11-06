import { useEffect, useState } from "react";
import { messageAPI } from "../api/client";
import type { Message } from "../api/client";
import { Card } from "../components/ui/card";
import { Loader2, Bookmark } from "lucide-react";
import AppLayout from "../components/AppLayout";

interface BookmarksPageProps {
  onLogout?: () => void;
}

export default function BookmarksPage({ onLogout }: BookmarksPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookmarkedMessages();
  }, []);

  const loadBookmarkedMessages = async () => {
    try {
      const data = await messageAPI.getBookmarkedMessages();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load bookmarked messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout onLogout={onLogout}>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bookmarked Messages</h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg text-muted-foreground">
                No bookmarked messages yet
              </p>
              <p className="text-sm text-muted-foreground/70">
                Bookmark messages during conversations to save them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="p-6 border-border/50">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg w-10 h-10 flex items-center justify-center ${
                        message.sender === "user" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {message.sender === "user" ? "You" : "AI"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.timestamp && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
