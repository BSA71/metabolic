export type TrackingMetricType = 'WAIST' | 'HIPS' | 'CHEST';

export type TrackingItem =
  | {
      kind: 'metric';
      metricType: TrackingMetricType;
      label: string;
      frequency: string;
      guidance: string;
      unit: string;
    }
  | {
      kind: 'photos';
      label: string;
      frequency: string;
      guidance: string;
    };

export const SNAPSHOT_TRACKING_ITEMS: TrackingItem[] = [
  {
    kind: 'metric',
    metricType: 'WAIST',
    label: 'Waist',
    frequency: 'Every week',
    guidance: 'This is the most important measurement',
    unit: 'in'
  },
  {
    kind: 'metric',
    metricType: 'HIPS',
    label: 'Hips',
    frequency: 'Every week',
    guidance: 'Measure around the widest point',
    unit: 'in'
  },
  {
    kind: 'metric',
    metricType: 'CHEST',
    label: 'Chest',
    frequency: 'Every week',
    guidance: 'Around the fullest point of the chest',
    unit: 'in'
  },
  {
    kind: 'photos',
    label: 'Progress photos',
    frequency: 'Every month',
    guidance: 'Front, side and back'
  }
];
