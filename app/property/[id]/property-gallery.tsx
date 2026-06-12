"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageOff, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: { url: string; display_order: number }[];
  title: string;
}

export function PropertyGallery({ photos, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fermer avec ESC, naviguer avec flèches
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + photos.length) % photos.length,
        );
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <ImageOff className="size-12 opacity-60" />
        <span className="text-sm">Aucune photo</span>
      </div>
    );
  }

  return (
    <>
      {/* Galerie : 1 grande photo + 4 vignettes */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[320px] md:h-[440px] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className={`relative ${photos.length === 1 ? "col-span-4 row-span-2" : "col-span-2 row-span-2"} group overflow-hidden`}
        >
          <Image
            src={photos[0].url}
            alt={`${title} - photo 1`}
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </button>

        {photos.slice(1, 5).map((p, idx) => (
          <button
            type="button"
            key={p.display_order}
            onClick={() => setLightboxIndex(idx + 1)}
            className="relative group overflow-hidden"
          >
            <Image
              src={p.url}
              alt={`${title} - photo ${idx + 2}`}
              fill
              sizes="(min-width: 1024px) 300px, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {idx === 3 && photos.length > 5 && (
              <div className="absolute inset-0 bg-black/60 grid place-items-center text-white font-semibold text-sm">
                +{photos.length - 5} photos
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            className="absolute top-4 right-4 z-10 size-10 grid place-items-center text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="size-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i === null ? null : (i - 1 + photos.length) % photos.length,
                  );
                }}
                className="absolute left-4 z-10 size-10 grid place-items-center text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i === null ? null : (i + 1) % photos.length,
                  );
                }}
                className="absolute right-4 z-10 size-10 grid place-items-center text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightboxIndex].url}
              alt={`${title} - photo ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono">
            {lightboxIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
