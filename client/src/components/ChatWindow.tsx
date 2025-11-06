import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  Copy,
} from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import { conversationAPI } from "../api/client";
import type { Message } from "../api/client";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

interface ChatWindowProps {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onConversationEnded?: () => void;
}

const SUGGESTIONS = [
  "Summarize recent notes",
  "Find key insights",
  "Generate action items",
  "Create timeline",
];

export default function ChatWindow({
  conversationId,
  onConversationCreated,
  onConversationEnded,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    try {
      const conversation = await conversationAPI.getConversation(id);
      if (conversation.messages) {
        setMessages(conversation.messages);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let currentConversationId = conversationId;

      const userMessage: Message = { sender: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      if (!currentConversationId) {
        const newConversation = await conversationAPI.createConversation(
          text.substring(0, 50) + (text.length > 50 ? "..." : "")
        );
        currentConversationId = newConversation.id;

        const response = await conversationAPI.sendMessage(
          currentConversationId,
          text
        );

        const aiMessage: Message = {
          sender: "ai",
          content: response.ai_response,
        };
        setMessages((prev) => [...prev, aiMessage]);
        onConversationCreated?.(currentConversationId);
      } else {
        const response = await conversationAPI.sendMessage(
          currentConversationId,
          text
        );

        const aiMessage: Message = {
          sender: "ai",
          content: response.ai_response,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        sender: "ai",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndConversation = async () => {
    if (!conversationId) return;
    setIsEnding(true);

    try {
      await conversationAPI.endConversation(conversationId);
      setShowEndDialog(false);
      setShowSuccessDialog(true);

      await loadConversation(conversationId);

      setTimeout(() => {
        setShowSuccessDialog(false);
        onConversationEnded?.();
      }, 2000);
    } catch (error) {
      console.error("Failed to end conversation:", error);
      setShowEndDialog(false);
      setErrorMessage("Failed to end conversation. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setIsEnding(false);
    }
  };

  const handleExport = async () => {
    if (!conversationId) return;

    try {
      const blob = await conversationAPI.exportConversation(
        conversationId,
        "json"
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation_${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Conversation exported as JSON`);
    } catch (error) {
      console.error("Failed to export conversation:", error);
      toast.error("Failed to export conversation");
    }
  };

  const handleShare = async () => {
    if (!conversationId) return;

    try {
      const { share_url } = await conversationAPI.shareConversation(
        conversationId
      );
      const fullUrl = `${window.location.origin}${share_url}`;
      setShareUrl(fullUrl);
      setShowShareDialog(true);
    } catch (error) {
      console.error("Failed to share conversation:", error);
      toast.error("Failed to share conversation");
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background w-full relative">
      {conversationId && (
        <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground font-medium">
              Active Conversation
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handleExport()}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button
              onClick={() => setShowEndDialog(true)}
              size="sm"
              variant="outline"
            >
              End Conversation
            </Button>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 overflow-y-auto p-6 w-full">
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2">What can I help with?</h2>
              <p className="text-muted-foreground text-base">
                Start a conversation or try one of the suggestions below
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  disabled={isLoading}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-border/80 transition-all text-left text-sm font-medium group disabled:opacity-50 active:scale-95"
                >
                  <div className="flex items-start gap-3">
                    <span>{suggestion}</span>
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="w-full px-4 sm:px-6 py-8">
              <div className="space-y-6 max-w-5xl mx-auto">
                {messages.map((m, i) => (
                  <div
                    key={
                      m.id ||
                      `msg-${i}-${m.sender}-${m.content.substring(0, 20)}`
                    }
                    className={`flex ${
                      m.sender === "user" ? "justify-end" : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-150`}
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
                        <ChatMessage
                          role={m.sender}
                          content={m.content}
                          messageId={m.id}
                          isBookmarked={m.is_bookmarked}
                          reactions={m.reactions}
                          onBookmarkToggle={() =>
                            conversationId && loadConversation(conversationId)
                          }
                          onReactionToggle={() =>
                            conversationId && loadConversation(conversationId)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex gap-3 items-end">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                      <div className="bg-muted px-4 py-3 rounded-2xl">
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 bg-foreground rounded-full animate-pulse" />
                          <div
                            className="w-2 h-2 bg-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-2 h-2 bg-foreground rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="w-full px-4 sm:px-6 pb-6 pt-4 border-t border-border">
            <div
              className="max-w-5xl mx-auto outline-none"
              ref={inputRef}
              tabIndex={-1}
            >
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </>
      )}

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Conversation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this conversation? A summary will be
              generated and added to the chat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isEnding}
            >
              Cancel
            </Button>
            <Button onClick={handleEndConversation} disabled={isEnding}>
              {isEnding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                "End Conversation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Conversation Ended
            </DialogTitle>
            <DialogDescription>
              Your conversation has been successfully ended and a summary has
              been generated.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error
            </DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Conversation
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <Button size="sm" variant="outline" onClick={copyShareUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
