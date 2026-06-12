import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImageOff } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getConversation } from "@/lib/actions/messages";
import { titleCase } from "@/lib/format";
import { ConversationView } from "./conversation-view";

interface Props {
  params: Promise<{ propertyId: string; otherId: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { propertyId, otherId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/messages/${propertyId}/${otherId}`);

  const conv = await getConversation(propertyId, otherId);
  if (!conv) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ArrowLeft className="size-4" /> Toutes les conversations
      </Link>

      {/* En-tête de conversation */}
      <header className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-muted">
          {conv.property.cover ? (
            <Image
              src={conv.property.cover}
              alt={conv.property.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageOff className="size-4" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {titleCase(conv.other_user.full_name)}
          </p>
          <Link
            href={`/property/${conv.property.id}`}
            className="text-xs text-muted-foreground hover:text-primary truncate block"
          >
            {titleCase(conv.property.title)} →
          </Link>
        </div>
      </header>

      <ConversationView
        currentUserId={user.id}
        propertyId={propertyId}
        otherUserId={otherId}
        initialMessages={conv.messages}
      />
    </div>
  );
}
