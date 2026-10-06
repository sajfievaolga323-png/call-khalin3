const FISH = ["🐠", "🐡", "🐟", "🐠", "🐡"];

/** Рисует анимированный аквариум. Stateless: положение объектов зависит только от t (секунды). */
export function drawAquarium(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0e6aa0");
  g.addColorStop(1, "#041325");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // лучи света
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = "#bdf3ff";
  for (let i = 0; i < 4; i++) {
    const x = w * (0.08 + i * 0.26) + Math.sin(t / 2 + i) * 18;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w * 0.1, 0);
    ctx.lineTo(x + w * 0.04, h);
    ctx.lineTo(x - w * 0.14, h);
    ctx.fill();
  }
  ctx.restore();

  // песок
  ctx.fillStyle = "#c9a96a";
  ctx.beginPath();
  ctx.ellipse(w / 2, h + h * 0.02, w * 0.75, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // кораллы
  ctx.lineCap = "round";
  const corals = [0.1, 0.22, 0.45, 0.68, 0.82, 0.93];
  corals.forEach((cx, i) => {
    const x = w * cx;
    const base = h * 0.97;
    const len = h * (0.12 + (i % 3) * 0.05);
    ctx.strokeStyle = i % 2 ? "#ff6b6b" : "#00d4ff";
    ctx.lineWidth = Math.max(3, w * 0.01);
    for (let b = -1; b <= 1; b++) {
      const sway = Math.sin(t * 1.2 + i + b) * 6;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + b * 10 + sway / 2, base - len * 0.6, x + b * 16 + sway, base - len * (b === 0 ? 1 : 0.75));
      ctx.stroke();
    }
  });

  // рыбки
  ctx.font = `${Math.round(h * 0.09)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textBaseline = "middle";
  const span = w + 140;
  FISH.forEach((f, i) => {
    const dir = i % 2 ? -1 : 1;
    const pos = ((t * (28 + i * 11) + i * 97) % span) - 70;
    const x = dir > 0 ? pos : w - pos;
    const y = h * (0.18 + i * 0.13) + Math.sin(t * 1.5 + i) * 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillText(f, 0, 0);
    ctx.restore();
  });

  // пузырьки
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(180,240,255,.8)";
  ctx.fillStyle = "rgba(180,240,255,.15)";
  for (let i = 0; i < 14; i++) {
    const x = w * ((i * 0.37 + 0.05) % 1) + Math.sin(t + i) * 6;
    const y = h - ((t * (30 + i * 7) + i * 53) % (h + 20)) + 10;
    const r = 3 + (i % 4) * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

/** Пузырьки переднего плана — рисуются поверх человека. */
export function drawForeground(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(200,245,255,.7)";
  ctx.fillStyle = "rgba(200,245,255,.12)";
  for (let i = 0; i < 6; i++) {
    const x = w * ((i * 0.53 + 0.12) % 1) + Math.sin(t * 1.3 + i) * 10;
    const y = h - ((t * (45 + i * 9) + i * 71) % (h + 30)) + 15;
    const r = 4 + (i % 3) * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
