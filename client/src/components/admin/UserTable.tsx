import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AdminUser } from '../../types';
import { Card } from '../ui/Card';
import { EditUserDrawer } from './EditUserDrawer';

function formatRole(role: string) {
  return role.replaceAll('_', ' ');
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function statusClass(status: AdminUser['status']) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
  if (status === 'INVITED') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function UserTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api<AdminUser[]>('/api/admin/users');
      setUsers(rows);
      setSelectedUserId((current) => (current && rows.some((user) => user.id === current) ? current : null));
    } catch (err) {
      setUsers([]);
      setSelectedUserId(null);
      setError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function handleSaved(updated: AdminUser) {
    setUsers((current) => current.map((user) => (user.id === updated.id ? { ...user, ...updated } : user)));
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Users</h2>
            <p className="text-sm text-slate-500">Click a row to edit account details.</p>
          </div>
          <span className="text-sm text-slate-500">{users.length} total</span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading users...</p>}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            {error.toLowerCase().includes('insufficient role') && (
              <p className="mt-2 text-red-700">
                Sign in as <code>admin@metabolic.local</code> to view and manage users.
              </p>
            )}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Phone</th>
                  <th className="py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const selected = selectedUserId === user.id;
                  return (
                    <tr
                      key={user.id}
                      tabIndex={0}
                      onClick={() => setSelectedUserId(user.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedUserId(user.id);
                        }
                      }}
                      className={`cursor-pointer border-b border-slate-100 transition last:border-0 ${
                        selected ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 pr-4 font-semibold">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{user.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatRole(user.role)}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{user.phone ?? '—'}</td>
                      <td className="py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No users found.</p>}
          </div>
        )}
      </Card>

      <EditUserDrawer
        open={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUserId(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
