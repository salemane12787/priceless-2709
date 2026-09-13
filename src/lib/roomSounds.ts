/**
 * Put your voice mp3s in:  public/sounds/
 * Exact file names (lowercase):
 *
 *   priceless.mp3   — she rips the fake $999 tag
 *   tiktok.mp3      — she picks “we met on TikTok”
 *   three.mp3       — she taps 3 (1+1=3)
 *   salmane.mp3     — she types your name
 *   distance.mp3    — she pulls the pins closer
 *   missme.mp3      — “when you miss me” note opens
 *   laugh.mp3       — “when you need a laugh” note opens
 *   birthday.mp3    — she types 27
 *   letter.mp3      — the letter appears
 *
 * Missing files are skipped. No need to change code.
 */

const players = new Map<string, HTMLAudioElement>();

export const CLIP = {
  priceless: 'sounds/priceless.mp3',
  tiktok: 'sounds/tiktok.mp3',
  three: 'sounds/three.mp3',
  salmane: 'sounds/salmane.mp3',
  distance: 'sounds/distance.mp3',
  missme: 'sounds/missme.mp3',
  laugh: 'sounds/laugh.mp3',
  birthday: 'sounds/birthday.mp3',
  letter: 'sounds/letter.mp3',
} as const;

export function playClip(src: string) {
  const url = `${import.meta.env.BASE_URL || '/'}${src}`;
  let audio = players.get(src);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.9;
    players.set(src, audio);
  }
  audio.currentTime = 0;
  void audio.play().catch(() => {
    /* file not there yet */
  });
}

export function stopRoomSounds() {
  /* one-shot voice clips keep playing into the next screen */
}
