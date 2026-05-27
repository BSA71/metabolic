import { useState } from 'react';
import type { AdminUser, Role, UserStatus } from '../../types';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

const roles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'COACH', 'USER', 'VIEWER'];
const statuses: UserStatus[] = ['ACTIVE', 'INVITED', 'DISABLED'];

type UserDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
};

function toDraft(user: AdminUser): UserDraft {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    status: user.status
  };
}

function formatRole(role: string) {
  return role.replaceAll('_', ' ');
}

function labelClassName() {
  return 'mb-1 block text-sm font-medium text-slate-600';
}

function inputClassName() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200';
}

export function EditUserDrawer({
  open,
  user,
  onClose,
  onSaved
}: {
  open: boolean;
  user?: AdminUser;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  return (
    <Drawer open={open} title={user ? `${user.firstName} ${user.lastName}` : 'Edit user'} onClose={onClose}>
      {open && user && <EditUserDrawerContent key={user.id} user={user} onClose={onClose} onSaved={onSaved} />}
    </Drawer>
  );
}

function EditUserDrawerContent({
  user,
  onClose,
  onSaved
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  const [draft, setDraft] = useState(() => toDraft(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateDraft<K extends keyof UserDraft>(field: K, value: UserDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() ? draft.phone.trim() : null,
        role: draft.role,
        status: draft.status
      };
      if (!payload.firstName || !payload.lastName || !payload.email) {
        throw new Error('First name, last name, and email are required.');
      }
      const updated = await api<AdminUser>(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Update account details for {user.email}.</p>

      <label className="block">
        <span className={labelClassName()}>First name</span>
        <input className={inputClassName()} value={draft.firstName} onChange={(event) => updateDraft('firstName', event.target.value)} />
      </label>

      <label className="block">
        <span className={labelClassName()}>Last name</span>
        <input className={inputClassName()} value={draft.lastName} onChange={(event) => updateDraft('lastName', event.target.value)} />
      </label>

      <label className="block">
        <span className={labelClassName()}>Email</span>
        <input className={inputClassName()} type="email" value={draft.email} onChange={(event) => updateDraft('email', event.target.value)} />
      </label>

      <label className="block">
        <span className={labelClassName()}>Phone</span>
        <input className={inputClassName()} value={draft.phone} onChange={(event) => updateDraft('phone', event.target.value)} placeholder="Optional" />
      </label>

      <label className="block">
        <span className={labelClassName()}>Role</span>
        <select className={inputClassName()} value={draft.role} onChange={(event) => updateDraft('role', event.target.value as Role)}>
          {roles.map((role) => (
            <option key={role} value={role}>
              {formatRole(role)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClassName()}>Status</span>
        <select className={inputClassName()} value={draft.status} onChange={(event) => updateDraft('status', event.target.value as UserStatus)}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
        <Button variant="secondary" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
