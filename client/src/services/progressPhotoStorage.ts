import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase';

export type ProgressPhotoSlot = 'front' | 'side' | 'back';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export function validateProgressPhotoFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Each photo must be 10 MB or smaller.');
  }
}

export async function uploadProgressPhoto(
  programId: string,
  date: string,
  slot: ProgressPhotoSlot,
  file: File
) {
  if (!storage) {
    throw new Error('Photo uploads are not configured. Add VITE_FIREBASE_STORAGE_BUCKET to client/.env.');
  }
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Sign in again to upload photos.');
  }

  validateProgressPhotoFile(file);

  const ext = extensionFor(file);
  const path = `progress-photos/${user.uid}/${programId}/${date}/${slot}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}
