"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadPropertyPhotoAction } from "@/lib/actions/uploads";

interface Props {
  initialUrls?: string[];
  onChange: (urls: string[]) => void;
  propertyId?: string;
  maxPhotos?: number;
}

// Patterns à détecter dans le texte OCR
const FORBIDDEN_REGEXES = [
  /(?:\+?261|0)\s*[2-9](?:[\s.-]?\d){8,9}/,
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
];

export function PhotoUpload({
  initialUrls = [],
  onChange,
  propertyId = "draft",
  maxPhotos = 10,
}: Props) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (next: string[]) => {
    setUrls(next);
    onChange(next);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxPhotos - urls.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxPhotos} photos.`);
      return;
    }

    setBusy(true);
    const filesToProcess = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];

    try {
      // Charger dynamiquement la lib de compression (50KB)
      setProgress("Préparation…");
      const { default: imageCompression } = await import(
        "browser-image-compression"
      );

      // Charger Tesseract.js uniquement quand on a besoin (lazy)
      let Tesseract: any = null;
      try {
        setProgress("Analyse anti-fraude (premier chargement long)…");
        Tesseract = await import("tesseract.js");
      } catch (err) {
        console.warn("[OCR] Tesseract indisponible, on continue sans OCR.", err);
      }

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setProgress(
          `Photo ${i + 1}/${filesToProcess.length} : compression…`,
        );

        // 1. Compression côté navigateur (~1MB, 1920px, WebP)
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });

        // 2. OCR pour détecter téléphone/email (si Tesseract chargé)
        if (Tesseract) {
          setProgress(`Photo ${i + 1}/${filesToProcess.length} : analyse OCR…`);
          try {
            const { data } = await Tesseract.recognize(compressed, "fra+eng", {
              logger: () => {},
            });
            const text = (data.text ?? "").trim();
            const blocked = FORBIDDEN_REGEXES.find((r) => r.test(text));
            if (blocked) {
              const m = text.match(blocked);
              toast.error(
                `Photo "${file.name}" rejetée : contient une coordonnée ("${m?.[0]}").`,
                { duration: 7000 },
              );
              continue;
            }
          } catch (err) {
            console.warn("[OCR] erreur, on accepte la photo:", err);
          }
        }

        // 3. Upload
        setProgress(`Photo ${i + 1}/${filesToProcess.length} : upload…`);
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("propertyId", propertyId);

        const res = await uploadPropertyPhotoAction(fd);
        if (!res.ok) {
          toast.error(`Photo "${file.name}" : ${res.error}`);
          continue;
        }
        newUrls.push(res.url);
      }

      if (newUrls.length > 0) {
        update([...urls, ...newUrls]);
        toast.success(
          `${newUrls.length} photo${newUrls.length > 1 ? "s" : ""} ajoutée${newUrls.length > 1 ? "s" : ""}.`,
        );
      }
    } catch (err: any) {
      console.error("[photo upload]", err);
      toast.error("Erreur lors du traitement.");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx: number) => {
    const next = urls.filter((_, i) => i !== idx);
    update(next);
  };

  return (
    <div className="space-y-3">
      {/* Grille de photos */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {urls.map((url, idx) => (
          <div
            key={url}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border group"
          >
            <Image
              src={url}
              alt={`Photo ${idx + 1}`}
              fill
              sizes="(min-width: 768px) 20vw, 33vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              aria-label="Supprimer cette photo"
              className="absolute top-1 right-1 size-6 grid place-items-center bg-black/60 hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="size-3" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] uppercase tracking-widest font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                Couverture
              </span>
            )}
          </div>
        ))}

        {urls.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="px-2 text-center leading-tight">
                  {progress ?? "Chargement…"}
                </span>
              </>
            ) : (
              <>
                <Upload className="size-5" />
                <span>Ajouter</span>
                <span className="text-[10px] text-muted-foreground/70">
                  {urls.length}/{maxPhotos}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Info anti-fraude */}
      <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2">
        <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-primary" />
        <p className="leading-relaxed">
          <span className="font-semibold">Photos sans coordonnées.</span> Téléphones
          et emails visibles sur les photos sont détectés automatiquement et rejetés.
          Les filigranes / logos sont autorisés.
        </p>
      </div>
    </div>
  );
}
