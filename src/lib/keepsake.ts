import { LETTER_PARAS } from './letter';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function downloadKeepsakeHtml() {
  const paras = LETTER_PARAS.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>For Firdaous — 27.09.2026</title>
<style>
  body{font-family:Nunito,system-ui,sans-serif;background:#fff6ea;color:#3a2a28;max-width:640px;margin:0 auto;padding:32px 20px;line-height:1.5}
  h1{font-family:Georgia,serif}
</style></head><body>
<p style="letter-spacing:.2em;text-transform:uppercase;color:#a07860;font-size:12px">For Firdaous · from Salmane · 27.09.2026</p>
<h1>Firdaous,</h1>
${paras}
<p style="font-family:Georgia,serif;font-size:28px;margin-top:28px">Salmane</p>
<p style="opacity:.6;font-style:italic">written by salmane not a fucking dumb ai</p>
</body></html>`;
  downloadBlob(new Blob([html], { type: 'text/html' }), 'for-firdaous-27-09-2026.html');
}

export async function downloadKeepsakePng() {
  try {
    await document.fonts?.ready;
  } catch {
    /* */
  }

  const w = 1080;
  const h = 1620;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    downloadKeepsakeHtml();
    return;
  }

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#3b0d14');
  bg.addColorStop(1, '#1a090c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#f4c430';
  ctx.font = '700 28px Nunito, sans-serif';
  ctx.fillText('FOR FIRDAOUS', 80, 110);
  ctx.fillStyle = '#c4a99a';
  ctx.font = '400 26px Nunito, sans-serif';
  ctx.fillText('from Salmane  ·  27.09.2026', 80, 150);

  roundRect(ctx, 70, 200, 940, 1280, 36);
  const paper = ctx.createLinearGradient(0, 200, 0, 1480);
  paper.addColorStop(0, '#fff6ea');
  paper.addColorStop(1, '#f3e0d0');
  ctx.fillStyle = paper;
  ctx.fill();

  ctx.fillStyle = '#3a2a28';
  ctx.font = '700 54px Fraunces, serif';
  ctx.fillText('Firdaous,', 120, 300);

  ctx.font = '400 32px Nunito, sans-serif';
  let y = 370;
  for (const para of LETTER_PARAS) {
    const lines = wrap(ctx, para, 820);
    for (const line of lines) {
      ctx.fillText(line, 120, y);
      y += 42;
    }
    y += 18;
  }

  ctx.font = '700 48px Fraunces, serif';
  ctx.fillText('Salmane', 120, y + 24);
  ctx.font = 'italic 24px Nunito, sans-serif';
  ctx.fillStyle = 'rgba(58,42,40,0.55)';
  ctx.fillText('written by salmane not a fucking dumb ai', 120, y + 70);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) {
    downloadKeepsakeHtml();
    return;
  }
  downloadBlob(blob, 'for-firdaous-27-09-2026.png');
}
