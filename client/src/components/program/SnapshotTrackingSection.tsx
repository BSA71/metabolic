import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus } from 'lucide-react';
import type { BloodPanelSummary, ProgramMetricSnapshot, ProgressPhotoSet } from '../../types';
import { parseDateKey } from '../../services/api';
import { Card } from '../ui/Card';
import { SNAPSHOT_TRACKING_ITEMS, type TrackingMetricType } from './snapshotTracking';
import { EditTrackingMeasurementDrawer } from './EditTrackingMeasurementDrawer';
import { EditProgressPhotosDrawer } from './EditProgressPhotosDrawer';
import { EditBloodPanelDrawer } from './EditBloodPanelDrawer';
import { BloodPanelMetricCard } from './bloodPanelDisplay';

type Props = {
  programId: string;
  userId: string;
  snapshots: ProgramMetricSnapshot[];
  progressPhotos: ProgressPhotoSet[];
  bloodPanels: BloodPanelSummary[];
  onSnapshotUpdated: (snapshot: ProgramMetricSnapshot) => void;
  onProgressPhotosUpdated: (photoSet: ProgressPhotoSet) => void;
  onBloodPanelUpdated: (panel: BloodPanelSummary) => void;
};

function metricValue(snapshot: ProgramMetricSnapshot, metricType: string) {
  const value = snapshot.values.find((row) => row.metricType === metricType);
  return value != null ? { value: Number(value.currentValue), unit: value.unit } : null;
}

function formatDate(date: string) {
  return parseDateKey(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function formatDelta(current: number, previous: number | null, unit: string) {
  if (previous == null || !Number.isFinite(previous)) return '—';
  const delta = current - previous;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)} ${unit}`;
}

function buildMeasurementHistory(snapshots: ProgramMetricSnapshot[], metricType: TrackingMetricType) {
  const chronological = [...snapshots]
    .filter((snapshot) => metricValue(snapshot, metricType))
    .sort((a, b) => a.date.localeCompare(b.date));

  return chronological.map((snapshot, index) => {
    const current = metricValue(snapshot, metricType)!;
    const previous = index > 0 ? metricValue(chronological[index - 1], metricType) : null;
    return {
      snapshot,
      value: current.value,
      unit: current.unit,
      change: formatDelta(current.value, previous?.value ?? null, current.unit)
    };
  });
}

export function SnapshotTrackingSection({
  programId,
  userId,
  snapshots,
  progressPhotos,
  bloodPanels,
  onSnapshotUpdated,
  onProgressPhotosUpdated,
  onBloodPanelUpdated
}: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<{
    metricType: TrackingMetricType;
    label: string;
    unit: string;
    snapshot?: ProgramMetricSnapshot;
    initialValue?: string;
  } | null>(null);
  const [editingPhotos, setEditingPhotos] = useState<ProgressPhotoSet | null | undefined>(undefined);
  const [editingBloodPanel, setEditingBloodPanel] = useState<BloodPanelSummary | null | undefined>(undefined);

  const latestBloodPanel = bloodPanels[0] ?? null;

  const histories = useMemo(
    () =>
      Object.fromEntries(
        SNAPSHOT_TRACKING_ITEMS.filter((item) => item.kind === 'metric').map((item) => [
          item.metricType,
          buildMeasurementHistory(snapshots, item.metricType)
        ])
      ) as Record<TrackingMetricType, ReturnType<typeof buildMeasurementHistory>>,
    [snapshots]
  );

  function mergeSnapshot(updated: ProgramMetricSnapshot) {
    onSnapshotUpdated(updated);
  }

  function mergePhotos(updated: ProgressPhotoSet) {
    onProgressPhotosUpdated(updated);
  }

  function mergeBloodPanel(updated: BloodPanelSummary) {
    onBloodPanelUpdated(updated);
  }

  return (
    <>
      <Card>
        <h2 className="mb-1 text-lg font-bold">Tracking Measurements</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-app-text-muted">
          Expand a metric to review history, or open the drawer to add or edit entries.
        </p>

        <div className="space-y-3">
          {SNAPSHOT_TRACKING_ITEMS.map((item) => {
            const key = item.kind === 'metric' ? item.metricType : 'photos';
            const expanded = expandedKey === key;

            if (item.kind === 'photos') {
              return (
                <div key={key} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-app-border">
                  <div className="flex items-start gap-3 p-4">
                    <button
                      type="button"
                      className="mt-0.5 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-app-text-muted dark:hover:bg-app-muted"
                      aria-expanded={expanded}
                      onClick={() => setExpandedKey(expanded ? null : key)}
                    >
                      <ChevronDown size={18} className={`transition ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-app-text">{item.label}</h3>
                          <p className="text-xs font-medium uppercase tracking-wide text-brand-green">{item.frequency}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-app-text-muted">{item.guidance}</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-app-border dark:text-app-text dark:hover:bg-app-muted"
                          onClick={() => setEditingPhotos(null)}
                        >
                          <Plus size={14} />
                          Add photos
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-app-border">
                          {progressPhotos.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-app-text-muted">No progress photo sets saved yet.</p>
                          ) : (
                            progressPhotos.map((photoSet) => (
                              <div
                                key={photoSet.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-app-muted"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-800 dark:text-app-text">{formatDate(photoSet.date)}</p>
                                  <p className="text-sm text-slate-500 dark:text-app-text-muted">
                                    {[photoSet.frontUrl && 'Front', photoSet.sideUrl && 'Side', photoSet.backUrl && 'Back']
                                      .filter(Boolean)
                                      .join(' · ') || 'No photos yet'}
                                  </p>
                                  {(photoSet.frontUrl || photoSet.sideUrl || photoSet.backUrl) && (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                      {photoSet.frontUrl && (
                                        <img src={photoSet.frontUrl} alt="Front" className="h-20 w-full rounded-lg object-cover" />
                                      )}
                                      {photoSet.sideUrl && (
                                        <img src={photoSet.sideUrl} alt="Side" className="h-20 w-full rounded-lg object-cover" />
                                      )}
                                      {photoSet.backUrl && (
                                        <img src={photoSet.backUrl} alt="Back" className="h-20 w-full rounded-lg object-cover" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-app-text-muted dark:hover:bg-app-surface dark:hover:text-app-text"
                                  aria-label="Edit progress photos"
                                  onClick={() => setEditingPhotos(photoSet)}
                                >
                                  <Pencil size={16} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            const history = histories[item.metricType];

            return (
              <div key={key} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-app-border">
                <div className="flex items-start gap-3 p-4">
                  <button
                    type="button"
                    className="mt-0.5 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-app-text-muted dark:hover:bg-app-muted"
                    aria-expanded={expanded}
                    onClick={() => setExpandedKey(expanded ? null : key)}
                  >
                    <ChevronDown size={18} className={`transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-app-text">{item.label}</h3>
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-green">{item.frequency}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-app-text-muted">{item.guidance}</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-app-border dark:text-app-text dark:hover:bg-app-muted"
                        onClick={() =>
                          setEditingMeasurement({
                            metricType: item.metricType,
                            label: item.label,
                            unit: item.unit
                          })
                        }
                      >
                        <Plus size={14} />
                        Add entry
                      </button>
                    </div>

                    {expanded && (
                      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 dark:border-app-border">
                        {history.length === 0 ? (
                          <p className="p-4 text-sm text-slate-500 dark:text-app-text-muted">No entries logged yet.</p>
                        ) : (
                          <table className="min-w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-app-muted dark:text-app-text-muted">
                              <tr>
                                <th className="px-3 py-2.5">Date</th>
                                <th className="px-3 py-2.5">Value</th>
                                <th className="px-3 py-2.5">Change</th>
                                <th className="px-3 py-2.5 w-12" aria-label="Edit" />
                              </tr>
                            </thead>
                            <tbody>
                              {[...history].reverse().map((entry) => (
                                <tr key={`${entry.snapshot.id}:${item.metricType}`} className="border-t border-slate-100 dark:border-app-border">
                                  <td className="px-3 py-3 text-sm text-slate-700 dark:text-app-text">{formatDate(entry.snapshot.date)}</td>
                                  <td className="px-3 py-3 text-sm font-medium text-slate-800 dark:text-app-text">
                                    {entry.value.toFixed(2)} {entry.unit}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-slate-600 dark:text-app-text-muted">{entry.change}</td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      type="button"
                                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-app-text-muted dark:hover:bg-app-muted dark:hover:text-app-text"
                                      aria-label={`Edit ${item.label.toLowerCase()} entry`}
                                      onClick={() =>
                                        setEditingMeasurement({
                                          metricType: item.metricType,
                                          label: item.label,
                                          unit: entry.unit,
                                          snapshot: entry.snapshot,
                                          initialValue: String(entry.value)
                                        })
                                      }
                                    >
                                      <Pencil size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-app-border">
            <div className="flex items-start gap-3 p-4">
              <button
                type="button"
                className="mt-0.5 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-app-text-muted dark:hover:bg-app-muted"
                aria-expanded={expandedKey === 'blood-panel'}
                onClick={() => setExpandedKey(expandedKey === 'blood-panel' ? null : 'blood-panel')}
              >
                <ChevronDown size={18} className={`transition ${expandedKey === 'blood-panel' ? 'rotate-180' : ''}`} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-app-text">Blood panel</h3>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-green">Quarterly or as tested</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-app-text-muted">
                      Lab results for metabolic health markers with reference-range status.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-app-border dark:text-app-text dark:hover:bg-app-muted"
                    onClick={() => setEditingBloodPanel(null)}
                  >
                    <Plus size={14} />
                    Add panel
                  </button>
                </div>

                {latestBloodPanel ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {latestBloodPanel.metrics.map((metric) => (
                      <BloodPanelMetricCard key={metric.key} metric={metric} compact />
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-app-text-muted">No blood panels saved yet.</p>
                )}

                {expandedKey === 'blood-panel' && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-app-border">
                    {bloodPanels.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-app-text-muted">Add your first blood panel to start tracking lab results.</p>
                    ) : (
                      bloodPanels.map((panel) => {
                        const metricCount = panel.metrics.filter((metric) => metric.value != null).length;
                        return (
                          <div
                            key={panel.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-app-muted"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-800 dark:text-app-text">{formatDate(panel.labDate)}</p>
                              <p className="text-sm text-slate-500 dark:text-app-text-muted">
                                {[panel.labProvider, `${metricCount} of 8 metrics`, panel.enteredBy ? `Added by ${panel.enteredBy.name}` : null]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-app-text-muted dark:hover:bg-app-surface dark:hover:text-app-text"
                              aria-label="Edit blood panel"
                              onClick={() => setEditingBloodPanel(panel)}
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {editingMeasurement && (
        <EditTrackingMeasurementDrawer
          open
          programId={programId}
          metricType={editingMeasurement.metricType}
          label={editingMeasurement.label}
          unit={editingMeasurement.unit}
          snapshot={editingMeasurement.snapshot}
          initialValue={editingMeasurement.initialValue}
          onClose={() => setEditingMeasurement(null)}
          onSaved={mergeSnapshot}
        />
      )}

      {editingPhotos !== undefined && (
        <EditProgressPhotosDrawer
          open
          programId={programId}
          photoSet={editingPhotos ?? undefined}
          onClose={() => setEditingPhotos(undefined)}
          onSaved={mergePhotos}
        />
      )}

      {editingBloodPanel !== undefined && (
        <EditBloodPanelDrawer
          open
          userId={userId}
          panel={editingBloodPanel ?? undefined}
          onClose={() => setEditingBloodPanel(undefined)}
          onSaved={mergeBloodPanel}
        />
      )}
    </>
  );
}
