"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Copy, Share2, Check } from "lucide-react";
import type { Note } from "@/lib/types";
import { encodeNote, estimateUrlLength } from "@/lib/share";

const QrCode = dynamic(() => import("./QrCode"), { ssr: false });

// QR v40, EC level L, byte mode ≈ 2953 bytes total URL
const QR_LIMIT = 2300;
const SOFT_LIMIT = 4000;

interface Props {
  note: Note;
  // Prebuilt link (contribution note); skips the fragment encoding
  url?: string;
  onClose: () => void;
}

type Tab = "link" | "qr";
type SizeTier = "ok" | "warn" | "qr-disabled";

function getSizeTier(urlLen: number): SizeTier {
  if (urlLen > QR_LIMIT) return "qr-disabled";
  if (urlLen > SOFT_LIMIT) return "warn";
  return "ok";
}

export default function ShareModal({ note, url, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("link");
  const [encodedUrl, setEncodedUrl] = useState<string | null>(null);
  const [encodedLen, setEncodedLen] = useState(0);
  const shareUrl = url ?? encodedUrl;
  const urlLen = url ? url.length : encodedLen;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (url) return;
    encodeNote(note).then((fragment) => {
      const url = `${window.location.origin}/s#${fragment}`;
      setEncodedUrl(url);
      estimateUrlLength(note, window.location.origin).then(setEncodedLen);
    });
  }, [note, url]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.share({ url: shareUrl, title: "Shared note" });
    } catch {
      // user cancelled or not supported — fall through
    }
  };

  const tier = getSizeTier(urlLen);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--dt-overlay) backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm rounded-xl border border-(--dt-border) bg-(--dt-popover) p-6 shadow-(--dt-shadow-lg)">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:text-(--dt-muted-foreground)"
        >
          <X size={14} strokeWidth={2} />
        </button>

        {/* Header */}
        <p className="mb-4 text-sm font-semibold text-(--dt-foreground)">{url ? "Contribution note" : "Share note"}</p>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-(--dt-border) bg-(--dt-input) p-0.5">
          {(["link", "qr"] as Tab[]).map((t) => {
            const isDisabled = t === "qr" && tier === "qr-disabled";
            return (
              <button
                key={t}
                disabled={isDisabled}
                onClick={() => !isDisabled && setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  tab === t
                    ? "bg-(--dt-secondary) text-(--dt-foreground)"
                    : "text-(--dt-subtle-foreground) hover:text-(--dt-muted-foreground)"
                } disabled:cursor-not-allowed disabled:opacity-30`}
              >
                {t === "link" ? "Link" : "QR code"}
              </button>
            );
          })}
        </div>

        {tab === "link" && (
          <div className="space-y-3">
            {/* Link box */}
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-(--dt-border) bg-(--dt-input) px-3 py-2">
              <span className="flex-1 truncate font-mono text-[10px] text-(--dt-subtle-foreground)">
                {shareUrl ?? "Generating…"}
              </span>
              <button
                onClick={handleCopy}
                disabled={!shareUrl}
                title="Copy link"
                className="flex flex-shrink-0 items-center justify-center rounded text-(--dt-subtle-foreground) transition-colors hover:text-(--dt-muted-foreground) disabled:opacity-30"
              >
                {copied ? (
                  <Check size={13} strokeWidth={2} className="text-(--dt-accent-foreground)" />
                ) : (
                  <Copy size={13} strokeWidth={2} />
                )}
              </button>
            </div>

            {/* Size meter */}
            {!url && urlLen > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-(--dt-icon-tertiary)">
                  <span>Link size</span>
                  <span>
                    {urlLen.toLocaleString()} chars
                    {tier === "warn" && " · long"}
                    {tier === "qr-disabled" && " · QR unavailable"}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-(--dt-control-track)">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (urlLen / 8000) * 100)}%`,
                      background:
                        tier === "qr-disabled"
                          ? "var(--dt-destructive)"
                          : tier === "warn"
                          ? "var(--dt-warning)"
                          : "var(--dt-positive)",
                    }}
                  />
                </div>
                {tier === "warn" && (
                  <p className="mt-1.5 text-[10px] text-(--dt-subtle-foreground)">
                    This link is long — some apps may truncate it.
                  </p>
                )}
                {tier === "qr-disabled" && (
                  <p className="mt-1.5 text-[10px] text-(--dt-subtle-foreground)">
                    Note is too long to encode as a QR code, but the link still works.
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopy}
                disabled={!shareUrl}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-(--dt-border) py-2 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground) disabled:opacity-30"
              >
                {copied ? (
                  <Check size={12} strokeWidth={2} className="text-(--dt-accent-foreground)" />
                ) : (
                  <Copy size={12} strokeWidth={2} />
                )}
                {copied ? "Copied!" : "Copy link"}
              </button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleShare}
                  disabled={!shareUrl}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-(--dt-border) py-2 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground) disabled:opacity-30"
                >
                  <Share2 size={12} strokeWidth={2} />
                  Share
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "qr" && shareUrl && <QrCode url={shareUrl} />}

        {/* Disclaimer */}
        <p className="mt-4 text-center text-[10px] text-(--dt-icon-tertiary)">
          {url
            ? "Anyone with this link can read and edit this note."
            : "Anyone with this link can read this note."}
        </p>
      </div>
    </div>
  );
}
