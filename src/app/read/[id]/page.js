'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { ArrowLeft, ExternalLink, Download, Lock, Share2 } from 'lucide-react';

export default function ReadEbook() {
  const params = useParams();
  const router = useRouter();
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);

  useEffect(() => {
    const ebookRef = ref(db, `ebooks/${params.id}`);
    const unsubscribe = onValue(ebookRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEbook({ id: params.id, ...data });
        if (!data.isPasswordProtected) {
          setIsUnlocked(true);
        }
      } else {
        setEbook(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.id]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ebook.password) {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setWrongPassword(false);
    } else {
      setWrongPassword(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/read/${ebook.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ebook.title,
          text: `Baca ebook "${ebook.title}" oleh ${ebook.author}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link berhasil disalin!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Ebook tidak ditemukan</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const isGoogleDoc = ebook.fileUrl?.includes('docs.google.com') || ebook.fileUrl?.includes('drive.google.com');
  const isPdf = ebook.fileUrl?.toLowerCase().endsWith('.pdf');
  const isDocx = ebook.fileUrl?.toLowerCase().endsWith('.docx') || ebook.fileUrl?.toLowerCase().endsWith('.doc');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {isUnlocked && (
                <>
                  <a
                    href={ebook.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka di Tab Baru
                  </a>
                  <a
                    href={ebook.fileUrl}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Ebook Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{ebook.title}</h1>
          <p className="text-gray-600 mb-4">Oleh: {ebook.author}</p>
          {ebook.category && (
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {ebook.category}
            </span>
          )}
          {ebook.isPasswordProtected && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full ml-2">
              <Lock className="w-3 h-3" />
              Protected
            </span>
          )}
          {ebook.description && (
            <p className="mt-4 text-gray-600">{ebook.description}</p>
          )}
        </div>

        {/* Reader */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="aspect-[16/9] bg-gray-100">
            {!isUnlocked ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ebook Terproteksi</h3>
                  <p className="text-gray-600 mb-4">Masukkan password untuk membaca ebook ini.</p>
                  <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    />
                    {wrongPassword && (
                      <p className="text-red-600 text-sm mb-3">Password salah!</p>
                    )}
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Buka Ebook
                    </button>
                  </form>
                </div>
              </div>
            ) : isGoogleDoc ? (
              <iframe
                src={ebook.fileUrl.replace('/edit', '/preview')}
                className="w-full h-full"
                title={ebook.title}
              />
            ) : isPdf ? (
              <iframe
                src={ebook.fileUrl}
                className="w-full h-full"
                title={ebook.title}
              />
            ) : isDocx ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(ebook.fileUrl)}&embedded=true`}
                className="w-full h-full"
                title={ebook.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <p className="text-gray-600 mb-4">Format file ini tidak dapat dipreview langsung.</p>
                  <a
                    href={ebook.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Buka File
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
