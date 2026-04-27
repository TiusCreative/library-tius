'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { Search, Book, ExternalLink, Share2, Lock, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const ebooksPerRow = 15;

  useEffect(() => {
    const ebooksRef = ref(db, 'ebooks');
    const categoriesRef = ref(db, 'categories');
    
    const unsubscribeEbooks = onValue(ebooksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ebooksList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setEbooks(ebooksList);
      } else {
        setEbooks([]);
      }
      setLoading(false);
    });

    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoriesList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setCategories(categoriesList);
      } else {
        setCategories([]);
      }
    });

    return () => {
      unsubscribeEbooks();
      unsubscribeCategories();
    };
  }, []);

  const filteredEbooks = ebooks.filter(ebook => {
    const matchesSearch = ebook.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ebook.author?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group ebooks by category
  const ebooksByCategory = categories.map(category => ({
    ...category,
    ebooks: filteredEbooks.filter(ebook => ebook.category === category.name)
  })).filter(cat => cat.ebooks.length > 0);

  // Add "Uncategorized" if any ebooks without category
  const uncategorizedEbooks = filteredEbooks.filter(ebook => !ebook.category);
  if (uncategorizedEbooks.length > 0) {
    ebooksByCategory.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      ebooks: uncategorizedEbooks
    });
  }

  const handleShare = async (ebook) => {
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

  const handleCoverClick = (ebook) => {
    setSelectedEbook(ebook);
    setShowDetailModal(true);
  };

  const scrollRow = (rowId, direction) => {
    const row = document.getElementById(rowId);
    if (row) {
      const scrollAmount = 300;
      row.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-tc.jpg" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              <h1 className="text-2xl font-bold text-gray-900">Library Ebook</h1>
            </div>
            <a
              href="/admin/login"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari ebook..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Ebook Rows by Category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {ebooksByCategory.length === 0 ? (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Tidak ada ebook yang ditemukan' : 'Belum ada ebook tersedia.'}
            </p>
          </div>
        ) : (
          ebooksByCategory.map((category) => (
            <div key={category.id} className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
              <div className="relative">
                <button
                  onClick={() => scrollRow(`row-${category.id}`, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 hover:scale-110 transition-all"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div
                  id={`row-${category.id}`}
                  className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {category.ebooks.map((ebook) => (
                    <div
                      key={ebook.id}
                      className="flex-shrink-0 w-32 cursor-pointer group"
                      onClick={() => handleCoverClick(ebook)}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                        {ebook.coverUrl ? (
                          <img
                            src={ebook.coverUrl}
                            alt={ebook.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <img
                            src={`https://picsum.photos/seed/${ebook.id}/300/400`}
                            alt={ebook.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        {ebook.isPasswordProtected && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{ebook.title}</h3>
                      <p className="text-xs text-gray-600">{ebook.author}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollRow(`row-${category.id}`, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 hover:scale-110 transition-all"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEbook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
              <div className="md:flex">
                <div className="md:w-1/3 p-6">
                  <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                    {selectedEbook.coverUrl ? (
                      <img
                        src={selectedEbook.coverUrl}
                        alt={selectedEbook.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={`https://picsum.photos/seed/${selectedEbook.id}/300/400`}
                        alt={selectedEbook.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-start gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedEbook.title}</h2>
                    {selectedEbook.isPasswordProtected && (
                      <Lock className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-lg text-gray-600 mb-4">{selectedEbook.author}</p>
                  {selectedEbook.category && (
                    <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mb-4">
                      {selectedEbook.category}
                    </span>
                  )}
                  {selectedEbook.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Deskripsi</h3>
                      <p className="text-gray-600">{selectedEbook.description}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {selectedEbook.fileUrl && (
                      <a
                        href={`/read/${selectedEbook.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Baca Ebook
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleShare(selectedEbook)}
                      className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}