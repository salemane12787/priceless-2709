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
