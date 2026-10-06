"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./Chat";

export type Remote = { id: string; name: string; stream: MediaStream | null; mic: boolean; cam: boolean };
type Status = "connecting" | "online" | "error";

/**
 * Комната на PeerJS (WebRTC, сетка «каждый с каждым»).
 * Первый вошедший занимает id `khalin-meet-<room>-host`; остальные подключаются к нему и получают список участников.
 * Видео/аудио и чат идут напрямую между браузерами, свой сервер не нужен.
 */
export function useRoom(roomId: string, name: string, stream: MediaStream | null, mediaReady: boolean) {
  const [remotes, setRemotes] = useState<Record<string, Remote>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<Status>("connecting");

  const peerRef = useRef<any>(null);
  const conns = useRef(new Map<string, any>());
  const calls = useRef(new Map<string, any>());
  const isHost = useRef(false);
  const outgoing = useRef<MediaStreamTrack | null>(null);
  const nameRef = useRef(name);
  const streamRef = useRef(stream);
  const stateRef = useRef({ mic: true, cam: true });
  nameRef.current = name;
  streamRef.current = stream;

  const patch = useCallback((id: string, p: Partial<Remote>) => {
    setRemotes((r) => {
      const prev: Remote | undefined = r[id];
      const base: Remote = prev ?? { id, name: "Участник", stream: null, mic: true, cam: true };
      return { ...r, [id]: { ...base, ...p } };
    });
  }, []);
  const drop = useCallback((id: string) => {
    conns.current.delete(id);
    calls.current.delete(id);
    setRemotes((r) => {
      const n = { ...r };
      delete n[id];
      return n;
    });
  }, []);

  const applyOutgoing = (call: any) => {
    const t = outgoing.current;
    const sender = call?.peerConnection?.getSenders?.().find((s: RTCRtpSender) => s.track?.kind === "video");
    if (t && sender) sender.replaceTrack(t).catch(() => {});
  };

  useEffect(() => {
    if (!mediaReady) return;
    let dead = false;
    let PeerCtor: any;
    const hostId = `khalin-meet-${roomId}-host`;

    const setupCall = (call: any) => {
      calls.current.set(call.peer, call);
      call.on("stream", (s: MediaStream) => {
        patch(call.peer, { stream: s });
        applyOutgoing(call);
      });
      call.on("close", () => drop(call.peer));
      call.on("error", () => drop(call.peer));
    };

    const setupConn = (c: any) => {
      conns.current.set(c.peer, c);
      c.on("open", () => {
        c.send({ t: "hello", name: nameRef.current, ...stateRef.current });
        if (isHost.current) c.send({ t: "peers", ids: [...conns.current.keys()].filter((k) => k !== c.peer) });
        patch(c.peer, {});
      });
      c.on("data", (d: any) => {
        if (d.t === "hello" || d.t === "state") patch(c.peer, { ...(d.name ? { name: d.name } : {}), mic: d.mic, cam: d.cam });
        else if (d.t === "chat") setMessages((m) => [...m, d.msg]);
        else if (d.t === "peers") (d.ids as string[]).forEach(connectTo);
      });
      c.on("close", () => drop(c.peer));
      c.on("error", () => drop(c.peer));
    };

    const connectTo = (id: string) => {
      const p = peerRef.current;
      if (!p || id === p.id || conns.current.has(id)) return;
      setupConn(p.connect(id, { reliable: true }));
      setupCall(p.call(id, streamRef.current ?? new MediaStream()));
    };

    const start = (asHost: boolean) => {
      if (dead) return;
      conns.current.clear();
      calls.current.clear();
      const p = new PeerCtor(asHost ? hostId : undefined);
      peerRef.current = p;
      isHost.current = asHost;
      p.on("open", () => {
        setStatus("online");
        if (!asHost) connectTo(hostId);
      });
      p.on("connection", setupConn);
      p.on("call", (call: any) => {
        call.answer(streamRef.current ?? new MediaStream());
        setupCall(call);
      });
      p.on("error", (e: any) => {
        if (dead) return;
        if (e.type === "unavailable-id") {
          p.destroy();
          setTimeout(() => start(false), 300);
        } else if (e.type === "peer-unavailable" && String(e.message).includes(hostId)) {
          p.destroy();
          setTimeout(() => start(true), 800);
        } else if (["network", "server-error", "socket-error", "socket-closed", "browser-incompatible", "webrtc"].includes(e.type)) {
          setStatus("error");
        }
      });
    };

    import("peerjs").then((m) => {
      PeerCtor = m.default;
      start(true);
    });

    return () => {
      dead = true;
      peerRef.current?.destroy();
      conns.current.clear();
      calls.current.clear();
      setRemotes({});
      setStatus("connecting");
    };
  }, [roomId, mediaReady, patch, drop]);

  const broadcast = (data: unknown) => conns.current.forEach((c) => c.open && c.send(data));

  useEffect(() => {
    broadcast({ t: "hello", name, ...stateRef.current });
  }, [name]);

  const send = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      name: nameRef.current,
      text,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((m) => [...m, { ...msg, own: true }]);
    conns.current.forEach((c) => c.open && c.send({ t: "chat", msg }));
  }, []);

  const broadcastState = useCallback((mic: boolean, cam: boolean) => {
    stateRef.current = { mic, cam };
    conns.current.forEach((c) => c.open && c.send({ t: "state", mic, cam }));
  }, []);

  /** Подменяет исходящий видеотрек (камера / аквариум / экран) у всех участников. */
  const setOutgoingVideo = useCallback((track: MediaStreamTrack | null) => {
    outgoing.current = track;
    calls.current.forEach(applyOutgoing);
  }, []);

  return { remotes, messages, status, send, broadcastState, setOutgoingVideo };
}
