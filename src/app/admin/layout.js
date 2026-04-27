'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Link from 'next/link';
import { LayoutDashboard, Book, Tags, Users, FileDown, Settings, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Ebook', icon: Book, path: '/admin/ebooks' },
    { name: 'Kategori', icon: Tags, path: '/admin/categories' },
    { name: 'User', icon: Users, path: '/admin/users' },
    { name: 'Import/Export', icon: FileDown, path: '/admin/import-export' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 p-3 w-full text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
