import fs from 'fs';
import path from 'path';

// Define the base directory for storing images
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directories exist
export function ensureDirectoriesExist() {
  // Create main uploads directory if it doesn't exist
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  return UPLOAD_DIR;
}

// Generate a unique filename for an uploaded image
export function generateUniqueFileName(artistId: number, originalName: string) {
  const timestamp = Date.now();
  const extension = path.extname(originalName);
  const fileName = `artist-${artistId}-${timestamp}${extension}`;
  return fileName;
}

// Save an image to the filesystem
export async function saveImage(buffer: Buffer, artistId: number, originalName: string): Promise<string> {
  // Ensure directories exist
  const uploadDir = ensureDirectoriesExist();
  
  // Generate unique filename
  const fileName = generateUniqueFileName(artistId, originalName);
  
  // Create full path
  const filePath = path.join(uploadDir, fileName);
  
  // Write file to disk
  await fs.promises.writeFile(filePath, buffer);
  
  // Return the relative path that will be stored in database
  return `/uploads/${fileName}`;
}