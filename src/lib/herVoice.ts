import { VOICE_UPLOAD_URL } from './voiceConfig';

type VoiceState = { recording: boolean; saving: boolean };
const listeners = new Set<(s: VoiceState) => void>();
let recording = false;
let saving = false;
let stream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
const chunks: Blob[] = [];

function notify() {
  listeners.forEach((fn) => fn({ recording, saving }));
}

export function subscribeVoice(fn: (s: VoiceState) => void) {
  listeners.add(fn);
  fn({ recording, saving });
  return () => {
    listeners.delete(fn);
  };
}

export function canUploadVoice() {
  return VOICE_UPLOAD_URL.startsWith('https://');
}

export async function toggleVoice() {
  if (!canUploadVoice()) return;
  if (recording) {
    await stopVoice();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks.length = 0;
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start();
  recording = true;
  notify();
}

export async function stopVoice() {
  if (!recorder || !recording) return;
  recording = false;
  notify();
  await new Promise<void>((resolve) => {
    recorder!.onstop = () => resolve();
    try {
      recorder!.stop();
    } catch {
      resolve();
    }
  });
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  recorder = null;
  const blob = new Blob(chunks, { type: 'audio/webm' });
  chunks.length = 0;
  if (blob.size < 200 || !canUploadVoice()) {
    notify();
    return;
  }
  saving = true;
  notify();
  try {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1];
      await fetch(VOICE_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          filename: `user_audio_${Date.now()}.webm`,
          mimeType: 'audio/webm',
          base64: base64data
        })
      });
      saving = false;
      notify();
    };
    return; // saving state will be reset in onloadend
  } catch {
    /* */
  }
  saving = false;
  notify();
}
