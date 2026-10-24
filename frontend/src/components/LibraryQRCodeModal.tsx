import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, ExternalLink } from 'lucide-react';
import { Button } from './Button';

interface LibraryQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LibraryQRCodeModal: React.FC<LibraryQRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const entryUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : 'http://localhost:5173/';

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(entryUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0C0D0F',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, entryUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'ahduni-library-focus-qr.png';
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-ink-900 border border-ink-700/80 p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-display font-bold text-white tracking-wide">
              LIBRARY CHALLENGE QR CODE
            </h3>
            <p className="text-xs text-ink-400 font-mono">
              Universal Station / Desk QR
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Poster */}
        <div className="p-6 rounded-xl bg-white text-ink-950 flex flex-col items-center justify-center space-y-4 text-center shadow-lg">
          <div className="font-display font-black text-sm tracking-widest uppercase text-ink-950">
            AHMEDABAD UNIVERSITY
          </div>
          <div className="text-[11px] font-mono tracking-wider text-ink-600 uppercase font-semibold">
            Library Focus Challenge
          </div>

          {/* QR Image */}
          <div className="p-2 border-2 border-ink-950 rounded-xl bg-white">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Library QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-ink-900">
              SCAN TO START YOUR ATTEMPT
            </div>
            <div className="text-[10px] text-ink-600 font-mono">
              Requires @ahduni.edu.in login • Unbroken focus
            </div>
          </div>
        </div>

        {/* Target URL notice */}
        <div className="flex items-center justify-between text-xs font-mono text-ink-400 bg-ink-950 px-3.5 py-2 rounded-lg border border-ink-800">
          <span className="truncate max-w-[260px]">{entryUrl}</span>
          <ExternalLink className="w-3.5 h-3.5 text-signal shrink-0" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
          >
            Download QR
          </Button>

          <Button
            variant="signal"
            size="md"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print Poster
          </Button>
        </div>
      </div>
    </div>
  );
};
