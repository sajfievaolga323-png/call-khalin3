"use client";

import { useEffect, useRef, useState } from "react";
import { MicOff } from "lucide-react";
import { drawAquarium, drawForeground } from "./drawAquarium";

const MP_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";

/** Скрипт MediaPipe — классический (не ES-модуль): надёжнее всего подключать его тегом <script>,
 *  тогда конструктор гарантированно появляется в window.SelfieSegmentation (в prod-сборке Next импорт ненадёжен). */
function loadSelfieSegmentation(): Promise<any> {
  const w = window as any;
  if (w.SelfieSegmentation) return Promise.resolve(w.SelfieSegmentation);
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = MP_SRC;
    el.crossOrigin = "anonymous";
    el.onload = () => (w.SelfieSegmentation ? resolve(w.SelfieSegmentation) : reject(new Error("no SelfieSegmentation")));
    el.onerror = () => reject(new Error("failed to load MediaPipe"));
    document.head.appendChild(el);
  }).catch(async () => {
    const mod: any = await import("@mediapipe/selfie_segmentation");
    return mod.SelfieSegmentation;
  });
}

type Props = {
  name: string;
  stream: MediaStream | null;
  muted?: boolean;
  micOn?: boolean;
  camOn?: boolean;
  /** Вызывается, когда аквариум включён (трек с обработанным видео) или выключен (null). */
  onProcessedTrack?: (t: MediaStreamTrack | null) => void;
};

export default function VideoTile({ name, stream, muted = false, micOn = true, camOn = true, onProcessedTrack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef(onProcessedTrack);
  cbRef.current = onProcessedTrack;
  const [aquarium, setAquarium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) v.play().catch(() => setBlocked(true)); // автозапуск со звуком может быть запрещён браузером
  }, [stream]);

  // Виртуальный фон: MediaPipe Selfie Segmentation + canvas-аквариум
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!aquarium || !video || !canvas || !stream) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stopped = false;
    let raf = 0;
    let seg: any = null;
    let outTrack: MediaStreamTrack | null = null;
    const person = document.createElement("canvas"); // слой «человек» отдельно от фона
    const pctx = person.getContext("2d")!;
    setLoading(true);
    setFailed(false);

    const start = async () => {
      const Ctor = await loadSelfieSegmentation();
      if (stopped || !Ctor) return;
      seg = new Ctor({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}` });
      seg.setOptions({ modelSelection: 1 });
      seg.onResults((r: any) => {
        if (stopped) return;
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = person.width = w;
          canvas.height = person.height = h;
        }
        // 1) вырезаем человека по маске
        pctx.save();
        pctx.clearRect(0, 0, w, h);
        pctx.filter = "blur(2px)";
        pctx.drawImage(r.segmentationMask, 0, 0, w, h);
        pctx.filter = "none";
        pctx.globalCompositeOperation = "source-in";
        pctx.drawImage(r.image, 0, 0, w, h);
        pctx.restore();
        // 2) фон-аквариум → человек → пузырьки поверх
        const t = performance.now() / 1000;
        drawAquarium(ctx, w, h, t);
        ctx.drawImage(person, 0, 0, w, h);
        drawForeground(ctx, w, h, t);
        if (!outTrack) {
          outTrack = (canvas as any).captureStream?.(30)?.getVideoTracks()[0] ?? null;
          cbRef.current?.(outTrack);
        }
        setLoading(false);
      });
      const loop = async () => {
        if (stopped) return;
        try {
          if (video.readyState >= 2) await seg.send({ image: video });
        } catch {}
        raf = requestAnimationFrame(loop);
      };
      loop();
    };
    start().catch(() => {
      setLoading(false);
      setFailed(true);
      setAquarium(false);
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      try { seg?.close?.(); } catch {}
      outTrack?.stop();
      cbRef.current?.(null);
      setLoading(false);
    };
  }, [aquarium, stream]);

  const showCanvas = aquarium && camOn;

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="glass relative aspect-video overflow-hidden bg-ocean-panel/60">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`absolute inset-0 h-full w-full object-cover ${showCanvas ? "opacity-0" : ""}`}
        />
        <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full object-cover ${showCanvas ? "" : "hidden"}`} />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-ocean-panel">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ocean-aqua/20 text-3xl font-bold text-ocean-aqua">
              {name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-ocean-bg/60 text-sm">Загрузка модели…</div>}
        {blocked && (
          <button
            onClick={() => videoRef.current?.play().then(() => setBlocked(false)).catch(() => {})}
            className="absolute inset-0 flex items-center justify-center bg-ocean-bg/70 text-base font-medium text-ocean-aqua"
          >
            ▶ Нажмите, чтобы включить видео и звук
          </button>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-sm">
          {!micOn && <MicOff size={14} className="text-ocean-coral" />}
          {name}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAquarium((v) => !v)}
          aria-pressed={aquarium}
          className={`rounded-xl border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-aqua ${
            aquarium ? "border-ocean-aqua bg-ocean-aqua/20 text-ocean-aqua" : "border-white/20 bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          🐠 Аквариум {aquarium ? "вкл" : "выкл"}
        </button>
        {failed && <span className="text-xs text-ocean-coral">Не удалось загрузить модель. Проверьте интернет.</span>}
      </div>
    </div>
  );
}
