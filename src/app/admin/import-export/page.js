'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { Download, Upload, FileDown, FileUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportExportPage() {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = {
        ebooks: ebooks,
        categories: categories,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `library-ebook-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const fileContent = await importFile.text();
      const importData = JSON.parse(fileContent);

      if (!importData.ebooks || !Array.isArray(importData.ebooks)) {
        throw new Error('Format file tidak valid');
      }

      let importedEbooks = 0;
      let importedCategories = 0;

      // Import categories
      if (importData.categories && Array.isArray(importData.categories)) {
        for (const category of importData.categories) {
          const { id, ...categoryData } = category;
          await push(ref(db, 'categories'), categoryData);
          importedCategories++;
        }
      }

      // Import ebooks
      for (const ebook of importData.ebooks) {
        const { id, ...ebookData } = ebook;
        await push(ref(db, 'ebooks'), ebookData);
        importedEbooks++;
      }

      setImportResult({
        success: true,
        message: `Berhasil import ${importedEbooks} ebook dan ${importedCategories} kategori`
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'Gagal import data: ' + error.message
      });
    } finally {
      setImporting(false);
      setImportFile(null);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Import/Export</h1>
        <p className="text-gray-500">Import dan export data ebook</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileDown className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Export Data</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Export semua data ebook dan kategori ke file JSON untuk backup atau transfer.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Ebook:</span>
              <span className="font-medium">{ebooks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Kategori:</span>
              <span className="font-medium">{categories.length}</span>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || ebooks.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Data
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <FileUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Import Data</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Import data ebook dan kategori dari file JSON yang sudah di-export sebelumnya.
          </p>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih File JSON</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={importing || !importFile}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Data
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {importResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm ${
            importResult.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {importResult.message}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Petunjuk Penggunaan</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Export:</strong> Klik tombol Export Data untuk mendownload file JSON berisi semua ebook dan kategori</li>
          <li>• <strong>Import:</strong> Pilih file JSON yang sudah di-export, lalu klik Import Data</li>
          <li>• <strong>Backup:</strong> Lakukan export secara berkala untuk backup data</li>
          <li>• <strong>Transfer:</strong> Gunakan export/import untuk memindahkan data ke sistem lain</li>
        </ul>
      </div>
    </div>
  );
}
