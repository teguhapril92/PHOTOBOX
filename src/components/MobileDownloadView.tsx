import React, { useEffect, useState } from 'react';
import { Download, Share2, Sparkles, Check, ArrowLeft, Cloud } from 'lucide-react';
import { getPhotoFromFirestore } from '../services/firebase';

interface MobileDownloadViewProps {
  photoId: string;
}

export const MobileDownloadView: React.FC<MobileDownloadViewProps> = ({ photoId }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Check if photo exists via API or Cloud Firestore
    fetch(`/api/photos/${photoId}/info`)
      .then((res) => {
        if (res.ok) {
          setImageUrl(`/api/photos/${photoId}`);
          setLoading(false);
        } else {
          getPhotoFromFirestore(photoId).then((data) => {
            if (data?.dataUrl) {
              setImageUrl(data.dataUrl);
            } else {
              setImageUrl(`/api/photos/${photoId}`);
            }
            setLoading(false);
          });
        }
      })
      .catch(() => {
        getPhotoFromFirestore(photoId).then((data) => {
          if (data?.dataUrl) {
            setImageUrl(data.dataUrl);
          } else {
            setImageUrl(`/api/photos/${photoId}`);
          }
          setLoading(false);
        });
      });
  }, [photoId]);

  const handleShare = async () => {
    if (navigator.share && imageUrl) {
      try {
        await navigator.share({
          title: 'Foto Photobooth PID',
          text: 'Lihat foto photobooth saya dari Layar PID!',
          url: window.location.href,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl || `/api/photos/${photoId}/download`;
    link.download = `PID-Photobooth-${photoId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 select-auto overflow-y-auto font-sans">
      {/* Mobile Header */}
      <header className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h1 className="text-base font-extrabold text-white tracking-tight">
            PID Photobooth Mobile
          </h1>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
          Siap Disimpan
        </span>
      </header>

      {/* Main Container */}
      <main className="my-auto py-6 flex flex-col items-center max-w-md mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-neutral-400">Memuat foto...</p>
          </div>
        ) : imageUrl ? (
          <div className="w-full flex flex-col items-center">
            {/* Image Container with smooth styling */}
            <div className="relative p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-6 max-w-full">
              <img
                src={imageUrl}
                alt="Photobooth Memory"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Big Touch Download Button for Smartphone */}
            <div className="w-full flex flex-col gap-3">
              <button
                id="mobile-download-btn"
                onClick={handleDirectDownload}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-extrabold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Simpan Foto ke Ponsel</span>
              </button>

              <button
                id="mobile-share-btn"
                onClick={handleShare}
                className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 border border-neutral-800 text-neutral-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Tautan Tersalin!' : 'Bagikan Foto (Share)'}</span>
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-center text-xs text-neutral-400 leading-relaxed">
              💡 <strong>Tips untuk iPhone & Android:</strong> Jika unduhan otomatis tidak muncul, kamu juga dapat menekan dan menahan gambar di atas lalu pilih <em>"Simpan ke Foto"</em>.
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-neutral-400 mb-4">Foto tidak ditemukan atau sudah kedaluwarsa.</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="pt-4 border-t border-neutral-900 text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Public Information Display Photobooth Kiosk</span>
      </footer>
    </div>
  );
};
