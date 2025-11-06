import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200).toString() + "px";
    }
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !input.trim()) return;
    onSend(input);
    setInput("");
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }, 0);
  };

  const hasText = input.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full bg-background">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex gap-3 w-full"
      >
        <div className="flex-1 relative items-center">
          <textarea
            ref={textareaRef}
            className="w-full px-4 overflow-y-hidden py-3 text-base rounded-lg border border-border bg-card hover:border-border/80 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Message RecallAI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            maxLength={4000}
          />
          {input.length > 3800 && (
            <div className=" text-xs text-muted-foreground">
              {input.length}/4000
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={disabled || !hasText}
          className="shrink-0 h-11 w-11 rounded-lg p-0"
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </motion.div>
    </form>
  );
}
