import { db } from '../../../../lib/firebase';
import { ref, get, update } from 'firebase/database';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { bookId } = await request.json();
    
    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    const bookRef = ref(db, `ebooks/${bookId}`);
    const snapshot = await get(bookRef);

    if (snapshot.exists()) {
      const bookData = snapshot.val();
      const currentViews = bookData.views || 0;
      
      await update(bookRef, { views: currentViews + 1 });
      return NextResponse.json({ success: true, views: currentViews + 1 });
    }

    return NextResponse.json({ error: 'Ebook tidak ditemukan' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mencatat view' }, { status: 500 });
  }
}