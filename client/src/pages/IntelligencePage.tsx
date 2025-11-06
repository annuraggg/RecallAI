import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { conversationAPI } from "@/api/client";
import { Input } from "@/components/ui/input";
import AppLayout from "../components/AppLayout";

interface IntelligencePageProps {
  onLogout?: () => void;
}

export default function IntelligencePage({ onLogout }: IntelligencePageProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleQuery = async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setHasAsked(true);
    setResponse("");
    setError("");

    try {
      const result = await conversationAPI.queryConversations(query);
      setResponse(result.response);
    } catch (err) {
      setError("Failed to query conversations. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "What topics have I discussed recently?",
    "Summarize my conversations from last week",
    "What did I learn about [specific topic]?",
    "Find conversations where I discussed [keyword]",
  ];

  return (
    <AppLayout onLogout={onLogout}>
      <div className="flex flex-col h-screen bg-background w-full">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4">
            {!hasAsked ? (
              <div className="flex flex-col items-center justify-center min-h-screen py-12">
                <div className="w-full space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">
                      Ask questions about your past conversations
                    </p>
                  </div>

                  <div className="space-y-3">
                    {exampleQueries.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(example)}
                        className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <span className="text-sm">{example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium">You</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-foreground">{query}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-1">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing your conversations...</span>
                      </div>
                    ) : error ? (
                      <div className="text-destructive">
                        <p>{error}</p>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-foreground">
                          {response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative flex items-center">
              <Input
                placeholder="Ask about your conversations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="resize-none pr-12 min-h-[52px] max-h-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery();
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                disabled={isLoading || !query.trim()}
                onClick={handleQuery}
                className="absolute right-2 h-8 w-8"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>↑</span>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
