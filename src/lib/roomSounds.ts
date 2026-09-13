import { Room } from '../types';

/**
 * Drop mp3 files in public/sounds/ then add the path here.
 * Example: tag: 'sounds/tag.mp3'
 * Missing files are ignored — nothing extra plays until you add them.
 */
export const ROOM_SOUNDS: Partial<Record<Room, string>> = {
  // window: already uses blow-theme.mp3 after candles
  // tag: 'sounds/tag.mp3',
  // aisle: 'sounds/tiktok.mp3',
  // calc: 'sounds/three.mp3',
  // mirror: 'sounds/name.mp3',
  // map: 'sounds/distance.mp3',
  // parcels: 'sounds/notes.mp3',
  // checkout: 'sounds/letter.mp3',
  // film: film has its own audio
};

const players = new Map<string, HTMLAudioElement>();

export function playRoomSound(room: Room) {
  const src = ROOM_SOUNDS[room];
  if (!src) return;
  const url = `${import.meta.env.BASE_URL || '/'}${src}`;
  let audio = players.get(src);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.85;
    players.set(src, audio);
  }
  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* file not there yet, or autoplay blocked */
  });
}

export function stopRoomSounds() {
  players.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}
