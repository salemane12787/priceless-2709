export type Room =
  | 'window'
  | 'tag'
  | 'aisle'
  | 'calc'
  | 'mirror'
  | 'map'
  | 'parcels'
  | 'checkout';

export const ROOM_ORDER: Room[] = [
  'window',
  'tag',
  'aisle',
  'calc',
  'mirror',
  'map',
  'parcels',
  'checkout',
];

export function nextRoom(current: Room): Room | null {
  const i = ROOM_ORDER.indexOf(current);
  if (i < 0 || i >= ROOM_ORDER.length - 1) return null;
  return ROOM_ORDER[i + 1];
}

export function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
