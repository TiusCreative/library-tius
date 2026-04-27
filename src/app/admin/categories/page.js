'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    const categoriesRef = ref(db, 'categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        await remove(ref(db, `categories/${id}`));
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Gagal menghapus kategori');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        updatedAt: new Date().toISOString()
      };

      if (editingCategory) {
        await update(ref(db, `categories/${editingCategory.id}`), categoryData);
      } else {
        categoryData.createdAt = new Date().toISOString();
        await push(ref(db, 'categories'), categoryData);
      }

      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Gagal menyimpan kategori');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kategori</h1>
          <p className="text-gray-500">Kelola kategori ebook</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Kategori
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada kategori. Tambahkan kategori pertama Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{category.description || 'Tidak ada deskripsi'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Fiksi, Sains, Teknologi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Deskripsi singkat tentang kategori ini"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
