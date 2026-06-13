import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { ClientGroup, CoachClient } from '../../types';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';

function clientName(client: CoachClient) {
  return `${client.firstName} ${client.lastName}`;
}

export function ClientGroupsDrawer({
  open,
  clients,
  groups,
  onClose,
  onGroupsChange
}: {
  open: boolean;
  clients: CoachClient[];
  groups: ClientGroup[];
  onClose: () => void;
  onGroupsChange: () => Promise<void>;
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [draftMembers, setDraftMembers] = useState<Record<string, string[]>>({});

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => clientName(a).localeCompare(clientName(b))),
    [clients]
  );

  function groupName(group: ClientGroup) {
    return draftNames[group.id] ?? group.name;
  }

  function groupMemberIds(group: ClientGroup) {
    return draftMembers[group.id] ?? group.memberIds;
  }

  async function runAction(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError('');
    let succeeded = false;
    try {
      await action();
      succeeded = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update groups');
    } finally {
      setBusy(null);
    }
    if (!succeeded) return;
    try {
      await onGroupsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Groups updated, but the list could not be refreshed.');
    }
  }

  async function createGroup() {
    const name = newGroupName.trim();
    if (!name) {
      setError('Enter a group name first.');
      return;
    }
    await runAction('create', async () => {
      await api<ClientGroup>('/api/coach/client-groups', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      setNewGroupName('');
    });
  }

  async function saveGroupName(group: ClientGroup) {
    const name = groupName(group).trim();
    if (!name) {
      setError('Group name cannot be empty.');
      return;
    }
    await runAction(`name:${group.id}`, async () => {
      await api<ClientGroup>(`/api/coach/client-groups/${group.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      setDraftNames((current) => {
        const next = { ...current };
        delete next[group.id];
        return next;
      });
    });
  }

  async function saveGroupMembers(group: ClientGroup) {
    await runAction(`members:${group.id}`, async () => {
      await api<ClientGroup>(`/api/coach/client-groups/${group.id}/members`, {
        method: 'PUT',
        body: JSON.stringify({ memberIds: groupMemberIds(group) })
      });
      setDraftMembers((current) => {
        const next = { ...current };
        delete next[group.id];
        return next;
      });
    });
  }

  async function deleteGroup(group: ClientGroup) {
    if (!window.confirm(`Delete "${group.name}"? Clients stay assigned to you; only the group is removed.`)) return;
    await runAction(`delete:${group.id}`, async () => {
      await api(`/api/coach/client-groups/${group.id}`, { method: 'DELETE' });
      setDraftNames((current) => {
        const next = { ...current };
        delete next[group.id];
        return next;
      });
      setDraftMembers((current) => {
        const next = { ...current };
        delete next[group.id];
        return next;
      });
    });
  }

  function toggleMember(group: ClientGroup, userId: string) {
    const current = new Set(groupMemberIds(group));
    if (current.has(userId)) current.delete(userId);
    else current.add(userId);
    setDraftMembers((state) => ({ ...state, [group.id]: [...current] }));
  }

  return (
    <Drawer open={open} title="Client groups" onClose={onClose}>
      <div className="space-y-6">
        <p className="text-sm text-app-text-muted">
          Organize assigned clients into lightweight groups for filtering. Groups do not change permissions or program
          ownership.
        </p>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="rounded-2xl border border-app-border p-4">
          <h3 className="text-sm font-semibold">Create group</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm"
              value={newGroupName}
              placeholder="Group name"
              onChange={(event) => setNewGroupName(event.target.value)}
            />
            <Button type="button" disabled={busy === 'create'} onClick={() => void createGroup()}>
              {busy === 'create' ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-app-text-muted">No groups yet. Create one to start filtering your client list.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const membersDirty =
                JSON.stringify([...groupMemberIds(group)].sort()) !== JSON.stringify([...group.memberIds].sort());
              const nameDirty = groupName(group) !== group.name;
              return (
                <div key={group.id} className="rounded-2xl border border-app-border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <label className="block text-xs font-medium uppercase text-app-text-muted">Group name</label>
                      <input
                        className="mt-1 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm"
                        value={groupName(group)}
                        onChange={(event) =>
                          setDraftNames((current) => ({ ...current, [group.id]: event.target.value }))
                        }
                      />
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {nameDirty && (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy === `name:${group.id}`}
                          onClick={() => void saveGroupName(group)}
                        >
                          {busy === `name:${group.id}` ? 'Saving…' : 'Save name'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy === `delete:${group.id}`}
                        onClick={() => void deleteGroup(group)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs font-medium uppercase text-app-text-muted">
                    Members ({groupMemberIds(group).length})
                  </p>
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                    {sortedClients.map((client) => (
                      <label key={client.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={groupMemberIds(group).includes(client.id)}
                          onChange={() => toggleMember(group, client.id)}
                        />
                        <span>{clientName(client)}</span>
                      </label>
                    ))}
                  </div>

                  {membersDirty && (
                    <Button
                      type="button"
                      className="mt-3"
                      disabled={busy === `members:${group.id}`}
                      onClick={() => void saveGroupMembers(group)}
                    >
                      {busy === `members:${group.id}` ? 'Saving…' : 'Save members'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
