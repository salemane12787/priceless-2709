import { Room, ROOM_ORDER } from '../types';

export type ParcelState = { miss: boolean; laugh: boolean; bday: boolean };
export type CheckoutStage = 'receipt' | 'letter';

export interface Progress {
  room: Room;
  parcels: ParcelState;
  checkout: CheckoutStage;
  musicUnlocked: boolean;
}

const KEY = 'priceless-2709-progress';

export const EMPTY_PARCELS: ParcelState = { miss: false, laugh: false, bday: false };

export function defaultProgress(): Progress {
  return {
    room: 'window',
    parcels: { ...EMPTY_PARCELS },
    checkout: 'receipt',
    musicUnlocked: false,
  };
}

function isRoom(v: unknown): v is Room {
  return typeof v === 'string' && (ROOM_ORDER as string[]).includes(v);
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const room = isRoom(parsed.room) ? parsed.room : 'window';
    return {
      room,
      parcels: {
        miss: !!parsed.parcels?.miss,
        laugh: !!parsed.parcels?.laugh,
        bday: !!parsed.parcels?.bday,
      },
      checkout: parsed.checkout === 'letter' ? 'letter' : 'receipt',
      musicUnlocked: !!parsed.musicUnlocked,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(next: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

export function roomFromLocation(): Room | null {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('room');
  if (r && isRoom(r)) return r;
  if (params.has('open')) return 'tag';
  return null;
}

export function roomUrl(room: Room) {
  const url = new URL(window.location.href);
  if (room === 'window') url.searchParams.delete('room');
  else url.searchParams.set('room', room);
  url.searchParams.delete('open');
  return `${url.pathname}${url.search}${url.hash}`;
}
