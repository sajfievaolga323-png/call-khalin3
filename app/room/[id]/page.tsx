"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Copy, Mic, MicOff, Monitor, MonitorOff, Settings, Users, Video, VideoOff, X } from "lucide-react";
import VideoTile from "@/components/VideoTile";
import Chat from "@/components/Chat";
import Logo from "@/components/Logo";
import { useRoom } from "@/components/useRoom";

const ctrl = "flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-aqua";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("Гость");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState(false);

  const { remotes, messages, status, send, broadcastState, setOutgoingVideo } = useRoom(id, name, stream, mediaReady);

  const aqTrack = useRef<MediaStreamTrack | null>(null);
  const screenTrack = useRef<MediaStreamTrack | null>(null);
  const camOnRef = useRef(true);

  useEffect(() => {
    try { setName(localStorage.getItem("khalin-name") || "Гость"); } catch {}
  }, []);

  // Камера и микрофон (если камеры нет — хотя бы микрофон)
  useEffect(() => {
    let s: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      const md = navigator.mediaDevices;
      if (!md?.getUserMedia) {
        setError("Браузер не даёт доступ к камере (нужен HTTPS). Чат работает.");
      } else {
        const tries: MediaStreamConstraints[] = [{ video: { width: 1280, height: 720 }, audio: true }, { video: false, audio: true }];
        for (const c of tries) {
          try { s = await md.getUserMedia(c); break; } catch {}
        }
        if (cancelled) return s?.getTracks().forEach((t) => t.stop());
        if (!s) setError("Нет доступа к камере и микрофону. Разрешите доступ в браузере. Чат работает.");
        else if (!s.getVideoTracks().length) { setCamOn(false); camOnRef.current = false; }
      }
      if (cancelled) return;
      setStream(s);
      setMediaReady(true);
    })();
    return () => {
      cancelled = true;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /** Что уходит собеседникам: экран > аквариум > камера. */
  const refreshOutgoing = useCallback(() => {
    const cam = stream?.getVideoTracks()[0] ?? null;
    setOutgoingVideo(screenTrack.current ?? (camOnRef.current ? aqTrack.current : null) ?? cam);
  }, [stream, setOutgoingVideo]);

  const onAquariumTrack = useCallback((t: MediaStreamTrack | null) => {
    aqTrack.current = t;
    refreshOutgoing();
  }, [refreshOutgoing]);

  const toggleMic = () => {
    const next = !micOn;
    stream?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
    broadcastState(next, camOn);
  };
  const toggleCam = () => {
    const next = !camOn;
    stream?.getVideoTracks().forEach((t) => (t.enabled = next));
    camOnRef.current = next;
    setCamOn(next);
    broadcastState(micOn, next);
    refreshOutgoing();
  };

  const stopScreen = useCallback(() => {
    screenTrack.current?.stop();
    screenTrack.current = null;
    setScreen(null);
    refreshOutgoing();
  }, [refreshOutgoing]);
  const toggleScreen = async () => {
    if (screen) return stopScreen();
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const t = s.getVideoTracks()[0];
      t.onended = stopScreen;
      screenTrack.current = t;
      setScreen(s);
      refreshOutgoing();
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const saveName = (v: string) => {
    const n = v.trim() || "Гость";
    setName(n);
    try { localStorage.setItem("khalin-name", n); } catch {}
  };

  const remoteList = Object.values(remotes);
  const count = 1 + (screen ? 1 : 0) + remoteList.length;
  const gridCls = count === 1 ? "mx-auto w-full max-w-4xl" : count <= 4 ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-ocean-bg p-3 lg:h-screen">
      <header className="glass flex items-center justify-between px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Logo size={28} /> Комната <span className="text-ocean-aqua">{id}</span>
          <span className="ml-3 flex items-center gap-1 text-sm font-normal text-white/70">
            <Users size={16} /> {1 + remoteList.length}
            {status === "connecting" && <span className="ml-1">· подключение…</span>}
            {status === "error" && <span className="ml-1 text-ocean-coral">· нет связи с сервером</span>}
          </span>
        </h1>
        <button
          onClick={copyLink}
          className="flex items-center gap-2 rounded-xl bg-ocean-aqua/20 px-3 py-2 text-sm text-ocean-aqua transition hover:bg-ocean-aqua/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-aqua"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Скопировано" : "Скопировать ссылку"}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_380px]">
        <section className="flex min-h-0 flex-col gap-3">
          <div className={`grid flex-1 content-start gap-3 overflow-y-auto ${gridCls}`}>
            <VideoTile name={`${name} (вы)`} stream={stream} muted micOn={micOn} camOn={camOn} onProcessedTrack={onAquariumTrack} />
            {screen && <VideoTile name="Ваш экран" stream={screen} muted />}
            {remoteList.map((r) => (
              <VideoTile key={r.id} name={r.name} stream={r.stream} micOn={r.mic} camOn={r.cam} />
            ))}
          </div>
          {error && <p className="rounded-xl bg-ocean-coral/20 p-3 text-sm text-ocean-coral">{error}</p>}
          {count === 1 && !error && status === "online" && (
            <p className="text-center text-sm text-white/60">Пока вы одни. Нажмите «Скопировать ссылку» и отправьте её собеседнику.</p>
          )}

          <div className="glass flex justify-center gap-3 px-4 py-3">
            <button onClick={toggleMic} aria-label="Микрофон" title="Микрофон" className={`${ctrl} ${micOn ? "bg-white/10" : "bg-ocean-coral"}`}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button onClick={toggleCam} aria-label="Камера" title="Камера" className={`${ctrl} ${camOn ? "bg-white/10" : "bg-ocean-coral"}`}>
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button onClick={toggleScreen} aria-label="Демонстрация экрана" title="Демонстрация" className={`${ctrl} ${screen ? "bg-ocean-aqua text-ocean-bg" : "bg-white/10"}`}>
              {screen ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            <button onClick={() => setSettings(true)} aria-label="Настройки" title="Настройки" className={`${ctrl} bg-white/10`}>
              <Settings size={20} />
            </button>
          </div>
        </section>

        <Chat messages={messages} onSend={send} />
      </div>

      {settings && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4" onClick={() => setSettings(false)}>
          <div className="glass w-full max-w-sm bg-ocean-panel/90 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">⚙️ Настройки</h2>
              <button onClick={() => setSettings(false)} aria-label="Закрыть"><X size={20} /></button>
            </div>
            <label htmlFor="nm" className="text-sm text-white/70">Ваше имя</label>
            <input
              id="nm"
              defaultValue={name}
              onBlur={(e) => saveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              maxLength={30}
              className="mt-1 w-full rounded-xl border border-white/20 bg-ocean-bg/60 px-4 py-2.5 outline-none focus:border-ocean-aqua"
            />
          </div>
        </div>
      )}
    </div>
  );
}
