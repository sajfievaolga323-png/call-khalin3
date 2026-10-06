"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AquariumBackground from "@/components/AquariumBackground";
import Logo from "@/components/Logo";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const createRoom = () => {
    const id = crypto.randomUUID().slice(0, 8);
    try {
      localStorage.setItem("khalin-name", name.trim() || "Гость");
    } catch {}
    router.push(`/room/${id}`);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4">
      <AquariumBackground />
      <div className="glass relative z-10 w-full max-w-sm p-8 text-center shadow-2xl">
        <div className="flex justify-center"><Logo size={72} /></div>
        <h1 className="mt-3 text-3xl font-bold text-ocean-aqua">Khalin Meet AI</h1>
        <p className="mt-1 text-sm text-white/60">Видеозвонки без регистрации</p>

        <label htmlFor="name" className="mt-6 block text-left text-sm text-white/80">Ваше имя</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createRoom()}
          placeholder="Например, Оля"
          maxLength={30}
          className="mt-1 w-full rounded-xl border border-white/20 bg-ocean-bg/60 px-4 py-3 text-white outline-none placeholder:text-white/40 focus:border-ocean-aqua focus:ring-2 focus:ring-ocean-aqua/40"
        />
        <button
          onClick={createRoom}
          className="mt-4 w-full rounded-xl bg-ocean-aqua px-4 py-3 font-semibold text-ocean-bg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Создать комнату
        </button>
      </div>
    </main>
  );
}
