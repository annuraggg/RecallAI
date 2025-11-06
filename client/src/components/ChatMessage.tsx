import { motion } from "framer-motion";
import { User, Bot, Bookmark, Heart, ThumbsUp, Smile, BookmarkCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { useState } from "react";
import { messageAPI } from "../api/client";

interface Props {
  role: string;
  content: string;
  messageId?: number;
  isBookmarked?: boolean;
  reactions?: string[];
  onBookmarkToggle?: () => void;
  onReactionToggle?: (reaction: string) => void;
}

const REACTION_ICONS = {
  'heart': Heart,
  'thumbsup': ThumbsUp,
  'smile': Smile,
};

export default function ChatMessage({ 
  role, 
  content, 
  messageId, 
  isBookmarked = false, 
  reactions = [],
  onBookmarkToggle,
  onReactionToggle 
}: Props) {
  const isUser = role === "user";
  const isSummary = content.includes("**Conversation Summary**");
  const [showActions, setShowActions] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(isBookmarked);
  const [localReactions, setLocalReactions] = useState<string[]>(reactions);

  const handleBookmark = async () => {
    if (!messageId) return;
    try {
      const result = await messageAPI.bookmarkMessage(messageId);
      setLocalBookmarked(result.is_bookmarked);
      onBookmarkToggle?.();
    } catch (error) {
      console.error('Failed to bookmark message:', error);
    }
  };

  const handleReaction = async (reaction: string) => {
    if (!messageId) return;
    try {
      const result = await messageAPI.reactToMessage(messageId, reaction);
      setLocalReactions(result.reactions);
      onReactionToggle?.(reaction);
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("__") && part.endsWith("__")) {
        return <u key={idx}>{part.slice(2, -2)}</u>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className={cn(
              "px-2 py-1 rounded font-mono text-xs",
              isUser ? "bg-primary-foreground/20" : "bg-background/50"
            )}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex gap-3 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && !isSummary && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Bot className="h-5 w-5 text-primary" />
        </motion.div>
      )}

      <div className="flex flex-col gap-1 max-w-2xl">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-sm wrap-break-word",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : isSummary
              ? "bg-blue-500/20 dark:bg-blue-500/10 rounded-bl-sm"
              : "bg-muted rounded-bl-sm"
          )}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-2">
            {renderContent(content)}
          </div>
        </div>

        {messageId && (
          <div className="flex items-center gap-1 px-1 h-7">
            {Object.entries(REACTION_ICONS).map(([name, Icon]) => {
              const isActive = localReactions.includes(name);
              const buttonClass = cn(
                "h-7 px-2 transition-opacity",
                isActive 
                  ? "opacity-100 bg-primary/10 text-primary" 
                  : showActions 
                    ? "opacity-100" 
                    : "opacity-0"
              );
              return (
                <Button
                  key={name}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(name)}
                  className={buttonClass}
                >
                  <Icon className="h-3 w-3" />
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={cn(
                "h-7 px-2 transition-opacity",
                localBookmarked 
                  ? "opacity-100 bg-primary/10 text-primary" 
                  : showActions 
                    ? "opacity-100" 
                    : "opacity-0"
              )}
            >
              {localBookmarked ? (
                <BookmarkCheck className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
        >
          <User className="h-5 w-5 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
}
