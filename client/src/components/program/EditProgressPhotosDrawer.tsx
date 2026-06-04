import { useEffect, useState } from 'react';
import type { ProgressPhotoSet } from '../../types';
import { api, parseDateKey, todayKey } from '../../services/api';
import { isFirebaseStorageConfigured } from '../../services/firebase';
import { uploadProgressPhoto, validateProgressPhotoFile, type ProgressPhotoSlot } from '../../services/progressPhotoStorage';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import {
  emptyPhotoDraft,
  ProgressPhotoUploadField,
  type PhotoDraft
} from './ProgressPhotoUploadField';

const PHOTO_SLOTS: Array<{ slot: ProgressPhotoSlot; label: string }> = [
  { slot: 'front', label: 'Front' },
  { slot: 'side', label: 'Side' },
  { slot: 'back', label: 'Back' }
];

function labelClassName() {
  return 'mb-1 block text-sm font-medium text-slate-600';
}

function inputClassName() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200';
}

function formatSessionDate(date: string) {
  return parseDateKey(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function EditProgressPhotosDrawer({
  open,
  programId,
  photoSet,
  onClose,
  onSaved
}: {
  open: boolean;
  programId: string;
  photoSet?: ProgressPhotoSet;
  onClose: () => void;
  onSaved: (photoSet: ProgressPhotoSet) => void;
}) {
  return (
    <Drawer open={open} title={photoSet ? 'Edit progress photos' : 'Add progress photos'} onClose={onClose}>
      {open && (
        <EditProgressPhotosDrawerContent
          key={photoSet?.id ?? 'new'}
          programId={programId}
          photoSet={photoSet}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Drawer>
  );
}

function EditProgressPhotosDrawerContent({
  programId,
  photoSet,
  onClose,
  onSaved
}: {
  programId: string;
  photoSet?: ProgressPhotoSet;
  onClose: () => void;
  onSaved: (photoSet: ProgressPhotoSet) => void;
}) {
  const [date, setDate] = useState(photoSet?.date ?? todayKey());
  const [photos, setPhotos] = useState<Record<ProgressPhotoSlot, PhotoDraft>>(() => ({
    front: emptyPhotoDraft(photoSet?.frontUrl ?? null),
    side: emptyPhotoDraft(photoSet?.sideUrl ?? null),
    back: emptyPhotoDraft(photoSet?.backUrl ?? null)
  }));
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  function selectPhoto(slot: ProgressPhotoSlot, file: File) {
    try {
      validateProgressPhotoFile(file);
      setPhotos((current) => {
        const previousPreview = current[slot].previewUrl;
        if (previousPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(previousPreview);
          setObjectUrls((urls) => urls.filter((url) => url !== previousPreview));
        }
        const previewUrl = URL.createObjectURL(file);
        setObjectUrls((urls) => [...urls, previewUrl]);
        return {
          ...current,
          [slot]: {
            existingUrl: current[slot].existingUrl,
            file,
            previewUrl
          }
        };
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to use that photo');
    }
  }

  async function save() {
    if (!isFirebaseStorageConfigured) {
      setError('Photo uploads are not configured. Add VITE_FIREBASE_STORAGE_BUCKET to client/.env.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const urls: Record<ProgressPhotoSlot, string | null> = {
        front: photos.front.existingUrl,
        side: photos.side.existingUrl,
        back: photos.back.existingUrl
      };

      for (const { slot } of PHOTO_SLOTS) {
        const draft = photos[slot];
        if (draft.file) {
          urls[slot] = await uploadProgressPhoto(programId, date, slot, draft.file);
        }
      }

      if (!urls.front && !urls.side && !urls.back) {
        throw new Error('Upload at least one progress photo.');
      }

      const updated = await api<ProgressPhotoSet>(`/api/programs/${programId}/progress-photos`, {
        method: 'POST',
        body: JSON.stringify({
          id: photoSet?.id,
          date,
          frontUrl: urls.front,
          sideUrl: urls.side,
          backUrl: urls.back
        })
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save progress photos');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {photoSet
          ? `Editing photos from ${formatSessionDate(photoSet.date)}`
          : 'Upload front, side, and back progress photos for this month.'}
      </p>

      <label className="block">
        <span className={labelClassName()}>Date</span>
        <input className={inputClassName()} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>

      {PHOTO_SLOTS.map(({ slot, label }) => (
        <ProgressPhotoUploadField
          key={slot}
          label={label}
          draft={photos[slot]}
          disabled={saving}
          onSelect={(file) => selectPhoto(slot, file)}
        />
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button disabled={saving} onClick={save}>
          {saving ? 'Uploading...' : 'Save photos'}
        </Button>
        <Button variant="secondary" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
