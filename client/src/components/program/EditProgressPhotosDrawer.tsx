import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { ProgressPhotoSet } from '../../types';
import { api, parseDateKey, todayKey } from '../../services/api';
import { isFirebaseStorageConfigured } from '../../services/firebase';
import { uploadProgressPhoto, validateProgressPhotoFile, type ProgressPhotoSlot } from '../../services/progressPhotoStorage';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

const PHOTO_SLOTS: Array<{ slot: ProgressPhotoSlot; label: string }> = [
  { slot: 'front', label: 'Front' },
  { slot: 'side', label: 'Side' },
  { slot: 'back', label: 'Back' }
];

type PhotoDraft = {
  existingUrl: string | null;
  file: File | null;
  previewUrl: string | null;
};

function emptyDraft(url: string | null = null): PhotoDraft {
  return { existingUrl: url, file: null, previewUrl: url };
}

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

function PhotoUploadField({
  label,
  draft,
  disabled,
  onSelect
}: {
  label: string;
  draft: PhotoDraft;
  disabled: boolean;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-500">JPG, PNG, or WEBP up to 10 MB</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} />
          {draft.previewUrl ? 'Replace' : 'Upload'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = '';
        }}
      />

      {draft.previewUrl ? (
        <img src={draft.previewUrl} alt={`${label} progress`} className="h-40 w-full rounded-xl object-cover" />
      ) : (
        <button
          type="button"
          disabled={disabled}
          className="flex h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={20} className="mb-2" />
          Choose photo
        </button>
      )}
    </div>
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
    front: emptyDraft(photoSet?.frontUrl ?? null),
    side: emptyDraft(photoSet?.sideUrl ?? null),
    back: emptyDraft(photoSet?.backUrl ?? null)
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
        <PhotoUploadField
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
