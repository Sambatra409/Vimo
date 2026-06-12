import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ImageOff } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listConversations } from "@/lib/actions/messages";
import { titleCase } from "@/lib/format";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/messages");

  const conversations = await listConversations();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Conversations
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">Messages</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {conversations.length === 0
            ? "Pas encore de conversation."
            : `${conversations.length} conversation${conversations.length > 1 ? "s" : ""} active${conversations.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
          <MessageSquare className="size-10 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Quand vous débloquerez un contact ou serez contacté par un locataire,
          </p>
          <p className="text-sm text-muted-foreground">la conversation apparaîtra ici.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {conversations.map((c) => (
            <Link
              key={`${c.property_id}-${c.other_user_id}`}
              href={`/messages/${c.property_id}/${c.other_user_id}`}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="relative size-14 shrink-0 rounded-xl overflow-hidden bg-muted">
                {c.property_cover ? (
                  <Image
                    src={c.property_cover}
                    alt={c.property_title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <ImageOff className="size-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">
                    {titleCase(c.other_user_name)}
                  </p>
                  {c.unread_count > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 rounded-full">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {titleCase(c.property_title)}
                </p>
                <p className="text-xs text-foreground/70 truncate mt-0.5">
                  {c.last_message}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground shrink-0">
                {new Date(c.last_message_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
