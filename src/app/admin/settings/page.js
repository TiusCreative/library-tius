'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../../../lib/firebase';
import { Settings as SettingsIcon, Save, Lock } from 'lucide-react';

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [globalPassword, setGlobalPassword] = useState('');
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(false);

  useEffect(() => {
    const settingsRef = ref(db, 'settings/security');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setIsPasswordEnabled(data.globalPasswordEnabled || false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalPasswordHash = '';
      
      if (isPasswordEnabled && globalPassword) {
        const msgBuffer = new TextEncoder().encode(globalPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        finalPasswordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const updateData = { globalPasswordEnabled: isPasswordEnabled };
      
      if (finalPasswordHash) {
        updateData.globalPasswordHash = finalPasswordHash;
      }

      await set(ref(db, 'settings/security'), updateData);
      
      alert('Pengaturan Keamanan berhasil disimpan!');
      setGlobalPassword('');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Pengaturan Sistem
        </h1>
        <p className="text-gray-500">Konfigurasi pengaturan global perpustakaan digital Anda.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5"/> Keamanan & Password Default
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input type="checkbox" id="enableGlobal" checked={isPasswordEnabled} onChange={e => setIsPasswordEnabled(e.target.checked)} className="w-5 h-5 text-blue-600 rounded cursor-pointer" />
            <label htmlFor="enableGlobal" className="font-medium text-gray-700 cursor-pointer">Aktifkan Password Global (Default)</label>
          </div>

          {isPasswordEnabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Set Password Global Baru</label>
              <input type="password" placeholder="Masukkan sandi..." value={globalPassword} onChange={e => setGlobalPassword(e.target.value)} className="border p-2.5 rounded-lg w-full outline-none focus:border-blue-500" required={isPasswordEnabled && globalPassword.length === 0} />
              <p className="text-xs text-gray-500">Kosongkan kolom ini jika Anda tidak ingin mengubah password global yang sudah ada sebelumnya.</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-end"><button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" />{isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}</button></div>
        </form>
      </div>
    </div>
  );
}
