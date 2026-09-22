import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Download, CheckCircle2, Smartphone, Home, Sparkles } from 'lucide-react';
import { soundFx } from '../services/audio';

interface DownloadQrScreenProps {
  finalImageUrl: string;
  photoId: string;
  downloadUrl: string;
  viewUrl: string;
  onFinishNow: () => void;
}

export const DownloadQrScreen: React.FC<DownloadQrScreenProps> = ({
  finalImageUrl,
  photoId,
  downloadUrl,
  viewUrl,
  onFinishNow,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Trigger celebration confetti and generate QR code
  useEffect(() => {
    soundFx.playSuccess();

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
      });
    } catch {
      // safe fallback
    }

    // Generate QR Code targeting the mobile download view page
    const targetUrl = viewUrl || `${window.location.origin}/p/${photoId}`;
    QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [viewUrl, photoId]);

  const handleManualDownload = () => {
    soundFx.playTouch();
    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = `PID-Photobooth-${photoId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = () => {
    soundFx.playTouch();
    onFinishNow();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto bg-neutral-950 text-neutral-100">
      {/* Top Bar: Title & Tombol Kembali ke Home */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-white">
            Foto Berhasil Dibuat!
          </span>
        </div>

        {/* Tombol Kembali ke Home di Atas */}
        <button
          id="back-to-home-top-btn"
          onClick={handleFinish}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-xs md:text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Home</span>
        </button>
      </div>

      {/* Main Content Area: QR Code & Photo Preview */}
      <div className="my-auto py-4 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto w-full">
        {/* Left Card: QR Code for Wireless Mobile Access */}
        <div className="flex-1 flex flex-col items-center text-center p-6 md:p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl max-w-md w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <Smartphone className="w-4 h-4" />
            <span>Pindai Nirkabel (Wireless)</span>
          </div>

          <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
            Pindai untuk Mengunduh
          </h3>
          <p className="text-xs md:text-sm text-neutral-400 mb-6 max-w-xs">
            Arahkan kamera HP atau pemindai QR ke kode di bawah untuk membuka dan menyimpan foto.
          </p>

          {/* QR Code Graphic Container */}
          <div className="relative p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
            {qrDataUrl ? (
              <img
                id="pid-photobooth-qr"
                src={qrDataUrl}
                alt="QR Code Unduhan Foto"
                className="w-52 h-52 md:w-64 md:h-64 object-contain"
              />
            ) : (
              <div className="w-52 h-52 md:w-64 md:h-64 flex items-center justify-center text-neutral-500 text-xs">
                Membuat Kode QR...
              </div>
            )}
          </div>

          <p className="text-[11px] text-neutral-500 font-mono">
            ID: {photoId}
          </p>
        </div>

        {/* Right Card: Photo Thumbnail & Direct Actions */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800 max-w-md w-full">
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
            Pratinjau Hasil Akhir
          </div>

          <div className="relative p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg mb-6 flex items-center justify-center max-h-[360px]">
            <img
              src={finalImageUrl}
              alt="Final Photobooth Print"
              className="max-h-[320px] max-w-full object-contain rounded-lg"
            />
          </div>

          {/* Direct Download Button (For Kiosk/USB/Operator) */}
          <button
            id="direct-download-btn"
            onClick={handleManualDownload}
            className="w-full py-3.5 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 text-neutral-200 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-colors mb-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Unduh Langsung ke Perangkat PID</span>
          </button>

          <span className="text-[11px] text-neutral-500 text-center">
            Foto tersimpan di server & Firebase, dapat diakses kapan saja.
          </span>
        </div>
      </div>

      {/* Bottom Footer Notice */}
      <div className="pt-2 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>Terima kasih telah menggunakan Photobooth Layar PID!</span>
      </div>
    </div>
  );
};
