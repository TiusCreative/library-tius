'use client';

import { useState, useEffect, useRef } from 'react';
import { Minus, Plus, Moon, Sun, Clock } from 'lucide-react';

export default function BookReader({ content, title }) {
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  const [fontFamily, setFontFamily] = useState('serif');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Load preferences from localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem('bookReader_fontSize');
    const savedDarkMode = localStorage.getItem('bookReader_darkMode');
    const savedFontFamily = localStorage.getItem('bookReader_fontFamily');

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    if (savedFontFamily) setFontFamily(savedFontFamily);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('bookReader_fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('bookReader_darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('bookReader_fontFamily', fontFamily);
  }, [fontFamily]);

  // Calculate reading time
  const calculateReadingTime = () => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const scrollHeight = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Font size controls
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(26, prev + 2));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(14, prev - 2));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Toggle font family
  const toggleFontFamily = () => {
    setFontFamily(prev => prev === 'serif' ? 'sans-serif' : 'serif');
  };

  // Styles
  const baseStyles = {
    backgroundColor: darkMode ? '#121212' : '#ffffff',
    color: darkMode ? '#eeeeee' : '#000000',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  };

  const contentStyles = {
    fontFamily: fontFamily === 'serif' 
      ? 'Georgia, "Times New Roman", Times, serif' 
      : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: `${fontSize}px`,
    lineHeight: '1.7',
    maxWidth: '700px',
    margin: '0 auto',
    padding: '16px',
    transition: 'font-size 0.2s ease',
  };

  const headingStyles = {
    h1: { fontSize: `${fontSize * 1.8}px`, fontWeight: 'bold', marginTop: '1.5em', marginBottom: '0.5em' },
    h2: { fontSize: `${fontSize * 1.5}px`, fontWeight: 'bold', marginTop: '1.3em', marginBottom: '0.4em' },
    h3: { fontSize: `${fontSize * 1.3}px`, fontWeight: 'bold', marginTop: '1.1em', marginBottom: '0.3em' },
  };

  const paragraphStyles = {
    marginBottom: '1.2em',
    textAlign: 'justify',
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .book-reader-container::-webkit-scrollbar {
      width: 8px;
    }
    .book-reader-container::-webkit-scrollbar-track {
      background: ${darkMode ? '#1a1a1a' : '#f1f1f1'};
    }
    .book-reader-container::-webkit-scrollbar-thumb {
      background: ${darkMode ? '#444' : '#888'};
      border-radius: 4px;
    }
    .book-reader-container::-webkit-scrollbar-thumb:hover {
      background: ${darkMode ? '#555' : '#666'};
    }
  `;

  return (
    <div className="min-h-screen" style={baseStyles}>
      <style>{scrollbarStyles}</style>
      
      {/* Sticky Top Bar */}
      <div 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          darkMode ? 'bg-[#121212] border-gray-800' : 'bg-white border-gray-200'
        } border-b shadow-sm`}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title & Reading Time */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-xs">
                {title || 'Book Reader'}
              </h1>
              <div className={`flex items-center gap-1 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{calculateReadingTime()} min</span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Font Size Controls */}
              <button
                onClick={decreaseFontSize}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Decrease font size"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className={`text-sm font-medium min-w-[3rem] text-center ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {fontSize}px
              </span>
              <button
                onClick={increaseFontSize}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Increase font size"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Font Family Toggle */}
              <button
                onClick={toggleFontFamily}
                className={`hidden sm:block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {fontFamily === 'serif' ? 'Serif' : 'Sans'}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div 
        ref={containerRef}
        className="book-reader-container overflow-y-auto"
        style={{ height: 'calc(100vh - 73px)' }}
      >
        <div 
          ref={contentRef}
          style={contentStyles}
        >
          {content ? (
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                ...paragraphStyles,
              }}
            />
          ) : (
            <div className="text-center py-12">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                No content available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Font Family Toggle (Bottom) */}
      <button
        onClick={toggleFontFamily}
        className={`sm:hidden fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-colors ${
          darkMode 
            ? 'bg-gray-800 text-gray-300' 
            : 'bg-white text-gray-700'
        }`}
        aria-label="Toggle font family"
      >
        {fontFamily === 'serif' ? 'Serif' : 'Sans'}
      </button>
    </div>
  );
}
