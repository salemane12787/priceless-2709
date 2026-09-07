import { useMemo } from 'react';

export default function Background() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 7) * 0.35}s`,
        size: 2 + (i % 3),
      })),
    [],
  );

  return (
    <div className="shop-bg" aria-hidden>
      {sparks.map((s) => (
        <span
          key={s.id}
          className="spark"
          style={{
            left: s.left,
            top: s.top,
            animationDelay: s.delay,
            width: s.size,
            height: s.size,
          }}
        />
      ))}
    </div>
  );
}
