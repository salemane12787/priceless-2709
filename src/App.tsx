import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Background from './components/Background';
import { Room, ROOM_ORDER, nextRoom } from './types';
import { isMusicOn, startMusic, stopMusic } from './lib/audio';
import RoomWindow from './rooms/RoomWindow';
import RoomTag from './rooms/RoomTag';
import RoomAisle from './rooms/RoomMemoryAisle';
import RoomCalc from './rooms/RoomCalc';
import RoomMirror from './rooms/RoomMirror';
import RoomMap from './rooms/RoomMap';
import RoomParcels from './rooms/RoomParcels';
import RoomCheckout from './rooms/RoomCheckout';
import RoomFilm from './rooms/RoomFilm';

function initialRoom(): Room {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('room') as Room | null;
  if (r && ROOM_ORDER.includes(r)) return r;
  if (params.has('open')) return 'tag';
  return 'window';
}

export default function App() {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [music, setMusic] = useState(false);

  const roomIndex = ROOM_ORDER.indexOf(room);

  const goNext = () => {
    setRoom((current) => nextRoom(current) ?? current);
  };

  const toggleMusic = () => {
    if (isMusicOn()) {
      stopMusic();
      setMusic(false);
    } else {
      startMusic();
      setMusic(true);
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

  return (
    <div className="shop-app">
      <Background />

      <header className="shop-bar">
        <div className="brand-pill">
          <strong>PRICELESS</strong>
          <span>a shop for Firdaous</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="bags" aria-hidden>
            {bags.map((b, i) => (
              <i key={i} className={`${b.on ? 'on' : ''} ${b.done ? 'done' : ''}`} />
            ))}
          </div>
          {(music || isMusicOn()) && (
            <button type="button" className="mute-btn" onClick={toggleMusic}>
              {isMusicOn() ? 'Mute' : 'Music'}
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {room === 'window' && (
          <RoomWindow
            key="window"
            onComplete={() => {
              setMusic(true);
              goNext();
            }}
          />
        )}
        {room === 'tag' && <RoomTag key="tag" onComplete={goNext} />}
        {room === 'aisle' && <RoomAisle key="aisle" onComplete={goNext} />}
        {room === 'calc' && <RoomCalc key="calc" onComplete={goNext} />}
        {room === 'mirror' && <RoomMirror key="mirror" onComplete={goNext} />}
        {room === 'map' && <RoomMap key="map" onComplete={goNext} />}
        {room === 'parcels' && <RoomParcels key="parcels" onComplete={goNext} />}
        {room === 'checkout' && (
          <RoomCheckout
            key="checkout"
            onContinue={goNext}
            onRestart={() => setRoom('window')}
          />
        )}
        {room === 'film' && (
          <RoomFilm key="film" onRestart={() => setRoom('window')} />
        )}
      </AnimatePresence>
    </div>
  );
}
