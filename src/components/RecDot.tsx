import { useEffect, useState } from 'react';
import { canUploadVoice, stopVoice, subscribeVoice, toggleVoice } from '../lib/herVoice';

export default function RecDot() {
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeVoice((s) => {
    setRecording(s.recording);
    setSaving(s.saving);
  }), []);

  useEffect(() => {
    const flush = () => {
      if (recording) void stopVoice();
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [recording]);

  if (!canUploadVoice()) return null;

  return (
    <button
      type="button"
      className={`rec-dot ${recording ? 'on' : ''} ${saving ? 'saving' : ''}`}
      onClick={() => void toggleVoice()}
      aria-label={recording ? 'Stop recording' : 'Record a voice note'}
    >
      <i />
    </button>
  );
}
