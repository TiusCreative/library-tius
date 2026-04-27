'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { Plus, Search, Edit, Trash2, Book, FileText, Upload, X } from 'lucide-react';

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEbook, setEditingEbook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    fileUrl: '',
    coverUrl: '',
    isPasswordProtected: false,
    password: ''
  });

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

  const filteredEbooks = ebooks.filter(ebook =>
    ebook.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEbook(null);
    setFormData({
      title: '',
      author: '',
      category: '',
      description: '',
      fileUrl: '',
      coverUrl: '',
      isPasswordProtected: false,
      password: ''
    });
    setFile(null);
    setCoverFile(null);
    setShowModal(true);
  };

  const handleEdit = (ebook) => {
    setEditingEbook(ebook);
    setFormData({
      title: ebook.title || '',
      author: ebook.author || '',
      category: ebook.category || '',
      description: ebook.description || '',
      fileUrl: ebook.fileUrl || '',
      coverUrl: ebook.coverUrl || '',
      isPasswordProtected: ebook.isPasswordProtected || false,
      password: ebook.password || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ebook ini?')) {
      try {
        await remove(ref(db, `ebooks/${id}`));
      } catch (error) {
        console.error('Error deleting ebook:', error);
        alert('Gagal menghapus ebook');
      }
    }
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = formData.fileUrl;
      let coverUrl = formData.coverUrl;

      // Upload file if provided
      if (file) {
        fileUrl = await uploadFile(file, 'ebook');
      }

      // Upload cover if provided
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'cover');
      }

      const ebookData = {
        title: formData.title,
        author: formData.author,
        category: formData.category,
        description: formData.description,
        fileUrl,
        coverUrl,
        isPasswordProtected: formData.isPasswordProtected,
        password: formData.isPasswordProtected ? formData.password : '',
        updatedAt: new Date().toISOString()
      };

      if (editingEbook) {
        await update(ref(db, `ebooks/${editingEbook.id}`), ebookData);
      } else {
        ebookData.createdAt = new Date().toISOString();
        await push(ref(db, 'ebooks'), ebookData);
      }

      setShowModal(false);
      setEditingEbook(null);
      setFile(null);
      setCoverFile(null);
    } catch (error) {
      console.error('Error saving ebook:', error);
      alert('Gagal menyimpan ebook: ' + error.message);
    } finally {
      setUploading(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Ebook</h1>
          <p className="text-gray-500">Kelola koleksi ebook perpustakaan digital</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Ebook
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari ebook berdasarkan judul atau penulis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Ebook List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredEbooks.length === 0 ? (
          <div className="p-12 text-center">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Tidak ada ebook yang ditemukan' : 'Belum ada ebook. Tambahkan ebook pertama Anda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penulis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEbooks.map((ebook) => (
                  <tr key={ebook.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ebook.coverUrl ? (
                          <img src={ebook.coverUrl} alt={ebook.title} className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                        ) : (
                          <img 
                            src={`https://picsum.photos/seed/${ebook.id}/100/140`} 
                            alt={ebook.title} 
                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{ebook.title}</p>
                          <p className="text-sm text-gray-500">{ebook.description?.substring(0, 50)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{ebook.author}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {ebook.category || 'Umum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(ebook)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ebook.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEbook ? 'Edit Ebook' : 'Tambah Ebook Baru'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Penulis</label>
                <input
                  type="text"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {categories.length === 0 ? 'Belum ada kategori. Buat di halaman Kategori.' : 'Pilih kategori dari daftar'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Ebook</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx,.epub,.mobi" onChange={(e) => setFile(e.target.files[0])} />
                      </label>
                      <p className="pl-1">atau drag & drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX, EPUB, MOBI (max 50MB)</p>
                    {file && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (Opsional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="cover-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload cover</span>
                        <input id="cover-upload" name="cover-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
                      </label>
                      <p className="pl-1">atau drag & drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (max 5MB)</p>
                    {coverFile && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">{coverFile.name}</span>
                        <button type="button" onClick={() => setCoverFile(null)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Jika kosong, akan menggunakan gambar random otomatis</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="passwordProtection"
                  checked={formData.isPasswordProtected}
                  onChange={(e) => setFormData({ ...formData, isPasswordProtected: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="passwordProtection" className="text-sm font-medium text-gray-700">
                  Proteksi dengan password
                </label>
              </div>

              {formData.isPasswordProtected && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    required={formData.isPasswordProtected}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan password untuk ebook ini"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengupload...
                    </>
                  ) : (
                    editingEbook ? 'Simpan Perubahan' : 'Tambah Ebook'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
