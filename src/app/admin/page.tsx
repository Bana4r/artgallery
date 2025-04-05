'use client';

import AdminCleanup from './AdminCleanup';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link href="/">
          <div className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md mr-4">
            &larr; Back to Artists
          </div>
        </Link>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminCleanup />
        
        {/* Other admin components can be added here */}
      </div>
    </div>
  );
}

/*este junto a otras carpeta de admin solo son para control y no se deben de acceder desde el front*/
/*tarde o temprano eliminare los api y interfaces de admin*/