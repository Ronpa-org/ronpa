"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { RadarChart } from "@/components/RadarChart";
import { CrownIcon, LockIcon } from "@/components/icons";
import { RESULT_STORAGE_KEY, type DebateScore } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type Stored = {
  theme: string;
  userSide: "肯定" | "否定";
  level?: string;
  win: boolean;
  total: number;
  scores: { logic: number; persuasion: number; rebuttal: number; structure: number };
  good: string;
  improve: string;
  summary: string;
  demo: boolean;
};

function fromApi(r: DebateScore): Stored {
  return {
    theme: r.theme,
    userSide: r.user_side,
    level: r.level,
    win: r.winner === "user",
    total: r.total,
    scores: r.scores,
    good: r.good,
    improve: r.improve,
    summary: r.summary,
    demo: false,
  };
}

// 結果はこの画面への遷移前に保存される。描画中の変更通知は不要。
const subscribeToResult = () => () => {};
const serverResult = () => undefined;

function readResult() {
  try {
    return sessionStorage.getItem(RESULT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const { t } = useLang();
  const raw = useSyncExternalStore(subscribeToResult, readResult, serverResult);
  let data: Stored | null | undefined = raw === undefined ? undefined : null;
  if (raw) {
    try {
      data = fromApi(JSON.parse(raw));
    } catch {
      data = null;
    }
  }

  if (data === undefined) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-xs tracking-[0.3em] text-ink-3">
          {t.result.loading}
        </p>
      </main>
    );
  }

  // 対戦データがなければサンプル表示
  const sample = t.data.sample;
  const view: Stored =
    data ?? {
      theme: sample.theme,
      userSide: sample.side,
      win: true,
      total: sample.total,
      scores: sample.axes,
      good: sample.good,
      improve: sample.improve,
      summary: sample.summary,
      demo: true,
    };

  const axes = (
    ["logic", "persuasion", "rebuttal", "structure"] as const
  ).map((key) => ({ label: t.result.axes[key], score: view.scores[key] }));
  const sideLabel = t.side[view.userSide];
  const levelLabel =
    view.level && view.level in t.levels
      ? t.levels[view.level as keyof typeof t.levels]
      : undefined;

  return (
    <main className="px-4 pb-10 pt-8">
      <p className="font-display text-center text-[10px] font-medium tracking-[0.4em] text-cyan/70">
        AI JUDGE RESULT
      </p>
      <h1 className="mt-1.5 text-center text-lg font-bold">{t.result.title}</h1>
      <p className="mt-2 text-center text-xs text-ink-2">{view.theme}</p>
      {levelLabel && (
        <p className="mt-1.5 text-center text-[10px] text-ink-3">
          {t.result.level}{" "}
          <span className="font-bold text-gold">{levelLabel}</span>
        </p>
      )}
      {view.demo && (
        <p className="mt-2 text-center text-[10px] tracking-widest text-ink-3">
          {t.result.demo}
        </p>
      )}

      {/* 勝敗 */}
      <div className="mt-4 flex items-center justify-center">
        {view.win ? (
          <span className="flex items-center gap-1.5 rounded-full border border-green/40 bg-green-soft px-4 py-1.5 text-sm font-bold text-green">
            <CrownIcon className="h-4 w-4" />
            {t.result.winPre}
            {sideLabel}
            {t.result.winPost}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent">
            {t.result.losePre}
            {sideLabel}
            {t.result.losePost}
          </span>
        )}
      </div>

      {/* 総合スコア */}
      <div className="mt-6 text-center">
        <p className="text-[9px] tracking-[0.3em] text-ink-3">
          {t.result.totalLabel}
        </p>
        <p className="text-glow mt-2 font-display text-5xl font-bold tabular-nums text-ink">
          {view.total}
          <span className="text-lg font-medium text-ink-3"> / 40</span>
        </p>
      </div>

      {/* レーダーチャート */}
      <div className="mt-6 border border-line bg-surface/80 p-4">
        <RadarChart axes={axes} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          {axes.map(({ label, score }) => (
            <div
              key={label}
              className="flex items-center justify-between border border-line bg-bg px-3 py-2"
            >
              <span className="text-xs text-ink-2">{label}</span>
              <span className="font-display text-sm font-bold text-cyan">
                {score}
                <span className="text-[10px] font-medium text-ink-3">/10</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AIフィードバック */}
      <section className="mt-4 flex flex-col gap-3">
        <div className="border border-green/40 bg-green-soft p-4">
          <p className="text-xs font-bold text-green">{t.result.good}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">{view.good}</p>
        </div>
        <div className="border border-accent/40 bg-accent-soft p-4">
          <p className="text-xs font-bold text-accent">{t.result.improve}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            {view.improve}
          </p>
        </div>
        <div className="border border-line bg-surface/80 p-4">
          <p className="text-xs font-bold text-ink">{t.result.summary}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            {view.summary}
          </p>
        </div>
      </section>

      {/* Premium誘導 */}
      <div className="mt-4 flex items-center gap-3 border border-gold/40 bg-gold-soft p-4">
        <LockIcon className="h-5 w-5 shrink-0 text-gold" />
        <p className="flex-1 text-[11px] leading-relaxed text-ink-2">
          <span className="font-bold text-gold">Premium</span>
          {t.result.premiumNote}
        </p>
        <button className="clip-corner shrink-0 border border-gold/40 px-3 py-1.5 text-[11px] font-bold text-gold hover:bg-gold-soft">
          {t.result.detail}
        </button>
      </div>

      {/* アクション */}
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/room?mode=ai"
          className="clip-corner glow-cyan bg-cyan py-3 text-center text-sm font-bold tracking-widest text-[#02131a] hover:bg-primary-hover"
        >
          {t.result.again}
        </Link>
        <Link
          href="/home"
          className="clip-corner border border-cyan/30 bg-cyan-soft py-3 text-center text-sm font-bold tracking-widest text-cyan hover:border-cyan/60"
        >
          {t.result.backHome}
        </Link>
      </div>
    </main>
  );
}
