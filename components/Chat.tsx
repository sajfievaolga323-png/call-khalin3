"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export type ChatMessage = { id: string; name: string; time: string; text: string; own?: boolean };

const PHRASES = ["Да", "Нет", "Подождите", "Спасибо", "Согласна", "Не поняла", "Повторите"];

export default function Chat({ messages, onSend }: { messages: ChatMessage[]; onSend: (t: string) => void }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <aside className="glass flex h-full min-h-[420px] flex-col overflow-hidden">
      <h2 className="border-b border-white/15 px-4 py-3 text-lg font-semibold">💬 Чат</h2>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {messages.length === 0 && <p className="text-sm text-white/50">Сообщений пока нет. Нажмите быструю фразу или напишите своё.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`rounded-xl p-3 ${m.own ? "bg-ocean-aqua/15" : "bg-white/10"}`}>
            <div className="flex items-baseline justify-between gap-2 text-xs text-white/60">
              <span className="font-semibold text-ocean-aqua">{m.name}</span>
              <time>{m.time}</time>
            </div>
            <p className="mt-1 break-words text-base">{m.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/15 p-3">
        <p className="mb-2 text-sm text-white/70">Быстрые фразы</p>
        <div className="flex flex-wrap gap-2">
          {PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => onSend(p)}
              className="select-none rounded-full border border-ocean-aqua/50 bg-ocean-aqua/10 px-5 py-2.5 text-base font-medium text-ocean-aqua transition hover:bg-ocean-aqua hover:text-ocean-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Написать сообщение..."
            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-ocean-bg/60 px-4 py-2.5 outline-none placeholder:text-white/40 focus:border-ocean-aqua"
          />
          <button
            onClick={submit}
            aria-label="Отправить"
            className="rounded-xl bg-ocean-coral px-4 text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
