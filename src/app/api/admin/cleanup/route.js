import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // This endpoint should be protected in production
    // You might want to add authentication check here
    
    const results = {
      orphanedFilesRemoved: 0,
      missingFilesInDb: 0,
      processedFiles: 0,
      errors: []
    };

    // Get all image records from database
    const [imageRows] = await pool.query(
      'SELECT id, imagen FROM galeria'
    );

    const dbImagePaths = new Set();
    const idToPathMap = new Map();

    // Process all image paths in the database
    imageRows.forEach(row => {
      const normalizedPath = row.imagen.startsWith('/') ? row.imagen.substring(1) : row.imagen;
      dbImagePaths.add(normalizedPath);
      idToPathMap.set(row.id, normalizedPath);
    });

    // Check for files in DB that don't exist in filesystem
    for (const [id, imgPath] of idToPathMap.entries()) {
      const fullPath = path.join(process.cwd(), 'public', imgPath);
      if (!fs.existsSync(fullPath)) {
        console.log(`Database references missing file: ${fullPath}`);
        results.missingFilesInDb++;
        
        // You could choose to remove these entries from the database
        // Uncomment below to enable automatic removal of broken references
        /*
        try {
          await pool.query('DELETE FROM galeria WHERE id = ?', [id]);
          console.log(`Removed broken reference from DB: image ID ${id}`);
        } catch (err) {
          console.error(`Failed to remove broken reference from DB: image ID ${id}`, err);
          results.errors.push(`Failed to remove broken DB reference: ${id}`);
        }
        */
      }
      results.processedFiles++;
    }

    // Find and process all upload directories
    const baseUploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(baseUploadDir)) {
      await processDirectory(baseUploadDir, dbImagePaths, results);
    } else {
      results.errors.push('Upload directory not found');
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      ...results
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup' },
      { status: 500 }
    );
  }
}

async function processDirectory(dirPath, dbImagePaths, results) {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(fullPath, dbImagePaths, results);
      } else if (entry.isFile()) {
        // Check if file is referenced in database
        const relativePath = fullPath.replace(process.cwd() + path.sep + 'public' + path.sep, '');
        const normalizedPath = relativePath.split(path.sep).join('/'); // Normalize path separators
        
        if (!dbImagePaths.has(normalizedPath)) {
          console.log(`Orphaned file found: ${normalizedPath}`);
          
          // Uncomment to enable automatic deletion of orphaned files
          
          try {
            await fs.promises.unlink(fullPath);
            console.log(`Deleted orphaned file: ${fullPath}`);
            results.orphanedFilesRemoved++;
          } catch (err) {
            console.error(`Failed to delete orphaned file: ${fullPath}`, err);
            results.errors.push(`Failed to delete: ${relativePath}`);
          }
          
          
          // For now, just count the orphaned files without deleting
          results.orphanedFilesRemoved++;
        }
        
        results.processedFiles++;
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}:`, err);
    results.errors.push(`Error processing directory: ${dirPath}`);
  }
}