'use client';

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Book, Tag, Users, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEbooks: 0,
    totalCategories: 0,
    totalUsers: 0,
    recentEbooks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ebooksRef = ref(db, 'ebooks');
    const categoriesRef = ref(db, 'categories');
    const usersRef = ref(db, 'users');

    const unsubscribeEbooks = onValue(ebooksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ebooksList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setStats(prev => ({
          ...prev,
          totalEbooks: ebooksList.length,
          recentEbooks: ebooksList.slice(-5).reverse()
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalEbooks: 0,
          recentEbooks: []
        }));
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
        setStats(prev => ({
          ...prev,
          totalCategories: categoriesList.length
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalCategories: 0
        }));
      }
    });

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setStats(prev => ({
          ...prev,
          totalUsers: usersList.length
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalUsers: 0
        }));
      }
    });

    return () => {
      unsubscribeEbooks();
      unsubscribeCategories();
      unsubscribeUsers();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-500">Selamat datang di panel admin perpustakaan digital</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total Ebook</h3>
            <Book className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEbooks}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Kategori</h3>
            <Tag className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.totalCategories}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">User</h3>
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
        </div>
      </div>

      {stats.recentEbooks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ebook Terbaru
          </h2>
          <div className="space-y-3">
            {stats.recentEbooks.map((ebook) => (
              <div key={ebook.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{ebook.title}</p>
                  <p className="text-sm text-gray-600">{ebook.author}</p>
                </div>
                {ebook.category && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {ebook.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
