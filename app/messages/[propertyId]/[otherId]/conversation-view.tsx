"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/messages";
import type { MessageRow } from "@/lib/types";

interface Props {
  currentUserId: string;
  propertyId: string;
  otherUserId: string;
  initialMessages: MessageRow[];
}

export function ConversationView({
  currentUserId,
  propertyId,
  otherUserId,
  initialMessages,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Polling simple : refresh toutes les 5s pour récupérer les nouveaux msgs
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Re-sync quand le serveur renvoie de nouveaux messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await sendMessageAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      // Optimistic : ajouter immédiatement
      setMessages((prev) => [...prev, res.message]);
      setContent("");
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col h-[60vh] md:h-[65vh]">
      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">
            Envoyez le premier message de cette conversation.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Form d'envoi */}
      <form
        onSubmit={handleSend}
        className="border-t border-border p-3 flex gap-2"
      >
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="recipientId" value={otherUserId} />
        <input
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre message…"
          maxLength={2000}
          disabled={pending}
          className="flex-1 min-h-12 px-4 py-3 bg-background border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={pending || !content.trim()}
          aria-label="Envoyer"
          className="size-12 grid place-items-center bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
