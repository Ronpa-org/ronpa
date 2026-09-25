"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase";
import { currentLang, useLang } from "@/lib/i18n";
import {
  scoreVersus,
  type ChatMsg,
  type VersusResult,
  type VersusSide,
} from "@/lib/versus";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Phase = "waiting" | "chat" | "scoring" | "result";

export function VersusRoomClient({
  code,
  role,
  name,
  theme: initialTheme,
}: {
  code: string;
  role: "host" | "guest";
  name: string;
  theme: string;
}) {
  const { t } = useLang();

  const mySide: VersusSide = role === "host" ? "肯定" : "否定";
  const isHost = role === "host";

  const [theme, setTheme] = useState(initialTheme);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [opponent, setOpponent] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<VersusResult | null>(null);
  const [notice, setNotice] = useState("");

  const channelRef = useRef<any>(null);
  const messagesRef = useRef<ChatMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!supabase) return;
    const uid = crypto.randomUUID();
    const channel = supabase.channel(`versus:${code}`, {
      config: { presence: { key: uid } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<any>();
        const people = Object.values(state).flat() as any[];
        const other = people.find((p) => p.uid !== uid);
        if (other) {
          setOpponent(other.name ?? "?");
          if (!isHost && other.theme) setTheme(other.theme);
          setPhase((p) => (p === "waiting" ? "chat" : p));
        } else {
          setOpponent(null);
        }
      })
      .on("broadcast", { event: "msg" }, ({ payload }) => {
        setMessages((m) =>
          m.some((x) => x.id === payload.id) ? m : [...m, payload],
        );
      })
      .on("broadcast", { event: "end" }, () => {
        setPhase("scoring");
      })
      .on("broadcast", { event: "result" }, ({ payload }) => {
        setResult(payload);
        setPhase("result");
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            uid,
            name,
            side: mySide,
            ...(isHost ? { theme } : {}),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      supabase?.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  const send = () => {
    const text = input.trim();
    if (!text || !channelRef.current) return;
    const msg: ChatMsg = {
      id: crypto.randomUUID(),
      side: mySide,
      name,
      text,
    };
    setMessages((m) => [...m, msg]);
    channelRef.current.send({ type: "broadcast", event: "msg", payload: msg });
    setInput("");
  };

  const finish = () => {
    if (!channelRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "end", payload: {} });
    setPhase("scoring");
  };

  // 採点はhostが一手に担当（自分のfinish/相手のfinishどちらでもphase→scoringで発火）
  useEffect(() => {
    if (phase === "scoring" && isHost && !result) {
      (async () => {
        try {
          const res = await scoreVersus(
            theme,
            messagesRef.current.map((m) => ({
              side: m.side,
              name: m.name,
              text: m.text,
            })),
            currentLang(),
          );
          setResult(res);
          setPhase("result");
          channelRef.current?.send({
            type: "broadcast",
            event: "result",
            payload: res,
          });
        } catch {
          setPhase("chat");
          setNotice("採点に失敗しました");
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---- 結果表示 ----
  if (phase === "result" && result) {
    const winSide = result.winner;
    const myWin = winSide === mySide;
    const sides: {
      key: VersusSide;
      label: string;
      textCls: string;
      winBorder: string;
      data: typeof result.affirmative;
    }[] = [
      {
        key: "肯定",
        label: t.versus.pro,
        textCls: "text-accent",
        winBorder: "border-accent/60",
        data: result.affirmative,
      },
      {
        key: "否定",
        label: t.versus.con,
        textCls: "text-blue",
        winBorder: "border-blue/60",
        data: result.negative,
      },
    ];
    return (
      <main className="min-h-dvh px-4 pb-10 pt-8">
        <p className="font-display text-center text-[10px] tracking-[0.4em] text-cyan/70">
          AI JUDGE RESULT
        </p>
        <h1 className="mt-1.5 text-center text-lg font-bold">
          {t.versus.resultTitle}
        </h1>
        <p className="mt-2 text-center text-xs text-ink-2">{theme}</p>
        <div className="mt-4 flex justify-center">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold ${
              myWin
                ? "border-green/40 bg-green-soft text-green"
                : "border-line bg-surface-2 text-ink-2"
            }`}
          >
            {winSide === "肯定" ? t.versus.pro : t.versus.con}
            {t.versus.winnerSuffix}
            {myWin ? " 🎉" : ""}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {sides.map(({ key, label, textCls, winBorder, data }) => (
            <div
              key={key}
              className={`border p-3 ${
                key === winSide ? winBorder : "border-line"
              } bg-surface/80`}
            >
              <p className={`text-xs font-bold ${textCls}`}>
                {label}
                {key === mySide ? `（${t.versus.you}）` : ""}
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {data.total}
                <span className="text-[10px] font-medium text-ink-3">/40</span>
              </p>
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-[10px] font-bold text-green">
                  {t.versus.good}
                </p>
                <p className="text-[11px] leading-relaxed text-ink-2">
                  {data.good}
                </p>
                <p className="mt-1 text-[10px] font-bold text-accent">
                  {t.versus.improve}
                </p>
                <p className="text-[11px] leading-relaxed text-ink-2">
                  {data.improve}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border border-line bg-surface/80 p-4">
          <p className="text-xs font-bold">{t.versus.comment}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            {result.comment}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/versus"
            className="clip-corner glow-cyan bg-cyan py-3 text-center text-sm font-bold tracking-widest text-[#02131a] hover:bg-primary-hover"
          >
            {t.versus.again}
          </Link>
          <Link
            href="/home"
            className="clip-corner border border-cyan/30 bg-cyan-soft py-3 text-center text-sm font-bold tracking-widest text-cyan hover:border-cyan/60"
          >
            {t.versus.backHome}
          </Link>
        </div>
      </main>
    );
  }

  // ---- 待機／議論画面 ----
  return (
    <main className="flex h-dvh flex-col">
      <header className="border-b border-line bg-surface/90 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <Link
            href="/versus"
            className="border border-line p-2 text-ink-3 hover:border-cyan/40"
          >
            <XIcon className="h-4 w-4" />
          </Link>
          <p className="text-[9px] font-medium tracking-[0.3em] text-cyan/70">
            VERSUS / {code}
          </p>
          <button
            onClick={finish}
            disabled={phase !== "chat" || messages.length === 0}
            className="clip-corner border border-gold/40 bg-gold-soft px-3 py-1.5 text-[10px] font-bold text-gold disabled:opacity-40"
          >
            {phase === "scoring" ? t.versus.scoring.slice(0, 6) : t.versus.finish}
          </button>
        </div>
        <p className="mt-3 text-center text-sm font-bold leading-snug">
          {theme}
        </p>
        <p className="mt-1.5 text-center text-[10px] text-ink-3">
          <span className="font-bold text-accent">
            {mySide === "肯定" ? t.versus.pro : t.versus.con}（{t.versus.you}）
          </span>
          {opponent && (
            <>
              {"　vs　"}
              <span className="font-bold text-blue">
                {mySide === "肯定" ? t.versus.con : t.versus.pro}（{opponent}）
              </span>
            </>
          )}
        </p>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {phase === "waiting" && (
          <div className="mt-10 flex flex-col items-center text-center">
            <span className="animate-pulse text-sm font-bold text-cyan">
              {t.versus.waiting}
            </span>
            <div className="clip-corner mt-4 border border-cyan/40 bg-cyan-soft px-6 py-3">
              <p className="text-[9px] tracking-[0.3em] text-ink-3">CODE</p>
              <p className="text-glow font-display text-4xl font-bold tracking-[0.15em] text-cyan">
                {code}
              </p>
            </div>
            <p className="mt-3 text-[11px] text-ink-3">{t.versus.shareCode}</p>
          </div>
        )}

        {messages.map((m) => {
          const mine = m.side === mySide;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <span className="mb-0.5 px-1 text-[9px] text-ink-3">
                {m.name}・{m.side === "肯定" ? t.versus.pro : t.versus.con}
              </span>
              <div
                className={`max-w-[80%] border px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  mine
                    ? "border-cyan/30 bg-cyan-soft text-ink"
                    : "border-line bg-surface/90 text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        {phase === "scoring" && (
          <p className="animate-pulse border border-cyan/30 bg-cyan-soft px-3.5 py-2.5 text-center text-xs font-bold text-cyan">
            {t.versus.scoring}
          </p>
        )}
        {notice && (
          <p className="border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-xs text-accent">
            {notice}
          </p>
        )}
        <div ref={bottomRef} />
      </section>

      <footer className="border-t border-line bg-surface/90 px-4 pb-6 pt-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={t.versus.placeholder}
            disabled={phase !== "chat"}
            className="min-h-[3rem] flex-1 resize-none border border-line bg-bg p-3 text-sm text-ink placeholder:text-ink-3 focus:border-cyan/60 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={phase !== "chat" || !input.trim()}
            className="clip-corner glow-cyan h-12 shrink-0 bg-cyan px-5 text-sm font-bold text-[#02131a] hover:bg-primary-hover disabled:opacity-40 disabled:shadow-none"
          >
            {t.versus.send}
          </button>
        </div>
      </footer>
    </main>
  );
}
