"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MicIcon,
  MicOffIcon,
  NoteIcon,
  SkipIcon,
  XIcon,
} from "@/components/icons";
import { useLang } from "@/lib/i18n";

type Side = "affirmative" | "negative" | "team" | "none" | "ai";

// フェーズ構成（ラベルは i18n の room.phases を同じ順で参照）
const phases: { step: number; side: Side; dur: number }[] = [
  { step: 0, side: "none", dur: 60 },
  { step: 1, side: "affirmative", dur: 120 },
  { step: 1, side: "negative", dur: 120 },
  { step: 2, side: "team", dur: 60 },
  { step: 3, side: "affirmative", dur: 120 },
  { step: 3, side: "negative", dur: 120 },
  { step: 4, side: "affirmative", dur: 60 },
  { step: 4, side: "negative", dur: 60 },
  { step: 5, side: "ai", dur: 30 },
];

const reactionEmojis = ["👏", "🔥", "🤔", "💡"];

type Player = { name: string; you?: boolean; bot?: boolean };

function Avatar({
  player,
  speaking,
  color,
  youLabel,
  speakingLabel,
}: {
  player: Player;
  speaking: boolean;
  color: "accent" | "blue" | "gold";
  youLabel: string;
  speakingLabel: string;
}) {
  const ring = {
    accent: "border-accent",
    blue: "border-blue",
    gold: "border-gold",
  }[color];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-surface-2 text-lg font-bold ${ring} ${
          speaking ? (color === "blue" ? "speaking-blue" : "speaking") : ""
        }`}
      >
        {player.bot ? "AI" : player.name[0]}
      </span>
      <span className="max-w-16 truncate text-[10px] font-bold text-ink-2">
        {player.you ? youLabel : player.name}
      </span>
      {speaking && (
        <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[9px] font-bold text-ink-2">
          {speakingLabel}
        </span>
      )}
    </div>
  );
}

export function RoomClient({ mode }: { mode: "ai" | "group" }) {
  const router = useRouter();
  const { t } = useLang();
  const [{ phaseIdx, remaining }, setClock] = useState({
    phaseIdx: 0,
    remaining: phases[0].dur,
  });
  const [micOn, setMicOn] = useState(true);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [floats, setFloats] = useState<{ id: string; emoji: string }[]>([]);

  const phase = phases[phaseIdx];
  const isLast = phaseIdx === phases.length - 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setClock((prev) => {
        if (prev.remaining > 1) {
          return { ...prev, remaining: prev.remaining - 1 };
        }
        if (prev.phaseIdx < phases.length - 1) {
          const next = prev.phaseIdx + 1;
          return { phaseIdx: next, remaining: phases[next].dur };
        }
        return prev.remaining === 0 ? prev : { ...prev, remaining: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0 && isLast) {
      router.push("/result");
    }
  }, [remaining, isLast, router]);

  const skip = () => {
    if (isLast) {
      router.push("/result");
      return;
    }
    setClock({ phaseIdx: phaseIdx + 1, remaining: phases[phaseIdx + 1].dur });
  };

  const handleReaction = (emoji: string) => {
    const id = crypto.randomUUID();
    setFloats((f) => [...f, { id, emoji }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
  };

  const affirmative: Player[] =
    mode === "ai"
      ? [{ name: "—", you: true }]
      : [{ name: "—", you: true }, { name: t.room.players.misaki }];
  const negative: Player[] =
    mode === "ai"
      ? [{ name: "RONPA AI", bot: true }]
      : [{ name: t.room.players.kenta }, { name: t.room.players.yuta }];

  const shown = Math.max(0, remaining);
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(shown % 60).padStart(2, "0");
  const progress = (shown / phase.dur) * 100;

  return (
    <main className="flex h-dvh flex-col">
      {/* 上部: テーマ・タイマー・フェーズ */}
      <header className="border-b border-line bg-surface/90 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/battle"
            className="border border-line p-2 text-ink-3 hover:border-cyan/40"
          >
            <XIcon className="h-4 w-4" />
          </Link>
          <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
            {t.room.category}
          </span>
          <button
            onClick={skip}
            className="flex items-center gap-1 border border-line bg-surface-2 px-3 py-1.5 text-[10px] font-bold text-ink-2 hover:border-cyan/40"
          >
            <SkipIcon className="h-3 w-3" />
            {t.room.skip}
          </button>
        </div>
        <p className="mt-3 text-center text-sm font-bold leading-snug">
          {t.room.theme}
        </p>
        <p className="text-glow mt-2 text-center font-display text-4xl font-bold tabular-nums text-ink">
          {mm}:{ss}
        </p>
        <p className="mt-1.5 text-center text-[11px] font-bold tracking-[0.2em] text-cyan">
          {t.room.phases[phaseIdx]}
        </p>
        <div className="mt-2 h-1 overflow-hidden bg-surface-2">
          <div
            className="glow-cyan h-full bg-gradient-to-r from-cyan/60 to-cyan transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* フェーズステッパー */}
        <div className="mt-3 flex justify-between gap-1">
          {t.room.steps.map((step, i) => (
            <span
              key={step}
              className={`flex-1 border py-1 text-center text-[9px] font-bold ${
                i === phase.step
                  ? "border-cyan/50 bg-cyan-soft text-cyan"
                  : "border-transparent text-ink-3"
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </header>

      {/* 中央: チーム・アバター */}
      <section className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto px-4 py-6">
        {phase.side === "team" && (
          <div className="border border-gold/40 bg-gold-soft px-4 py-2.5 text-center text-[11px] font-bold text-gold">
            {t.room.strategyBanner}
          </div>
        )}
        {phase.side === "ai" && (
          <div className="border border-cyan/30 bg-cyan-soft px-4 py-2.5 text-center text-[11px] font-bold text-cyan">
            {t.room.aiBanner}
          </div>
        )}
        <div>
          <p className="mb-3 text-center text-[11px] font-bold tracking-[0.3em] text-accent">
            {t.side.肯定}
          </p>
          <div className="flex justify-center gap-6">
            {affirmative.map((p, i) => (
              <Avatar
                key={`${p.name}-${i}`}
                player={p}
                color="accent"
                speaking={phase.side === "affirmative" && i === 0}
                youLabel={t.ai.you}
                speakingLabel={t.room.speaking}
              />
            ))}
          </div>
        </div>
        <p className="font-display text-center text-sm font-bold tracking-[0.4em] text-ink-3">
          VS
        </p>
        <div>
          <div className="flex justify-center gap-6">
            {negative.map((p, i) => (
              <Avatar
                key={`${p.name}-${i}`}
                player={p}
                color="blue"
                speaking={phase.side === "negative" && i === 0}
                youLabel={t.ai.you}
                speakingLabel={t.room.speaking}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] font-bold tracking-[0.3em] text-blue">
            {t.side.否定}
          </p>
        </div>
        {mode === "group" && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold text-ink-3">
              {t.room.judge}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold bg-surface-2 text-[10px] font-bold">
              {t.room.players.aoi[0]}
            </span>
            <span className="text-[10px] text-ink-2">{t.room.players.aoi}</span>
          </div>
        )}
        {isLast && (
          <button
            onClick={() => router.push("/result")}
            className="clip-corner glow-cyan mx-auto bg-cyan px-6 py-2.5 text-sm font-bold text-[#02131a] hover:bg-primary-hover"
          >
            {t.room.viewResult}
          </button>
        )}
      </section>

      {/* 下部: マイク・メモ・リアクション */}
      <footer className="relative border-t border-line bg-surface/90 px-4 pb-6 pt-3">
        <div className="pointer-events-none absolute -top-14 right-8">
          {floats.map(({ id, emoji }) => (
            <span
              key={id}
              className="reaction-float absolute right-0 text-2xl"
            >
              {emoji}
            </span>
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="rounded-full border border-line bg-surface-2 px-3 py-1 text-base hover:border-cyan/40 active:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-8">
          <button
            onClick={() => setMemoOpen(true)}
            className="flex flex-col items-center gap-1 text-ink-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-2 hover:border-cyan/40">
              <NoteIcon className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-bold">{t.room.memo}</span>
          </button>
          <button
            onClick={() => setMicOn(!micOn)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                micOn
                  ? "glow-cyan bg-cyan text-[#02131a]"
                  : "border border-line bg-surface-2 text-ink-3"
              }`}
            >
              {micOn ? (
                <MicIcon className="h-6 w-6" />
              ) : (
                <MicOffIcon className="h-6 w-6" />
              )}
            </span>
            <span
              className={`text-[9px] font-bold ${micOn ? "text-cyan" : "text-ink-3"}`}
            >
              {micOn ? t.room.micOn : t.room.muted}
            </span>
          </button>
          <Link
            href="/home"
            className="flex flex-col items-center gap-1 text-ink-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-2 hover:border-accent/60">
              <XIcon className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-bold">{t.room.leave}</span>
          </Link>
        </div>
      </footer>

      {/* メモシート */}
      {memoOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70"
          onClick={() => setMemoOpen(false)}
        >
          <div
            className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-cyan/30 bg-surface p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-surface-2" />
            <p className="mt-4 flex items-baseline gap-2 text-sm font-bold">
              {t.room.memo}
              <span className="text-[8px] font-medium tracking-[0.3em] text-ink-3">
                {t.room.memoEn}
              </span>
            </p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={t.room.memoPlaceholder}
              className="mt-3 h-40 w-full resize-none border border-line bg-bg p-3 text-sm text-ink placeholder:text-ink-3 focus:border-cyan/60 focus:outline-none"
            />
            <button
              onClick={() => setMemoOpen(false)}
              className="clip-corner mt-3 w-full border border-line bg-surface-2 py-2.5 text-sm font-bold text-ink hover:border-cyan/40"
            >
              {t.room.close}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
