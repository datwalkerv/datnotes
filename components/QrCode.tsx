"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

interface Props {
  url: string;
}

// Loaded via next/dynamic so this import only runs client-side after the QR tab is opened
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode = typeof window !== "undefined" ? require("qrcode") : null;

export default function QrCode({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !QRCode) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: "#ededeb", light: "#101010" },
    }).catch(() => setError(true));
  }, [url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "datnotes-qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  if (error) {
    return (
      <p className="py-4 text-center text-xs text-(--dt-subtle-foreground)">
        Note is too long to generate a QR code.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="overflow-hidden rounded-lg border border-(--dt-border) bg-(--dt-card)">
        <canvas ref={canvasRef} />
      </div>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 rounded-md border border-(--dt-border) px-3 py-1.5 text-xs font-medium text-(--dt-subtle-foreground) transition-colors hover:border-(--dt-input-border) hover:text-(--dt-muted-foreground)"
      >
        <Download size={12} strokeWidth={2} />
        Download PNG
      </button>
    </div>
  );
}
