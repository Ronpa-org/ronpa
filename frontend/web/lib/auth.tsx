"use client";

// Supabase 認証のコンテキスト（ログイン状態をアプリ全体で共有）
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";

type AuthResult = { error: string | null };
// autoLogin: メール確認OFF時は登録と同時にセッションが作られる（即ログイン）
type SignUpResult = { error: string | null; autoLogin: boolean };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  configured: false,
  signUp: async () => ({ error: "未設定", autoLogin: false }),
  signIn: async () => ({ error: "未設定" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    // 起動時に既存セッションを復元
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // ログイン/ログアウトを監視
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
  ): Promise<SignUpResult> => {
    if (!supabase) return { error: "認証が設定されていません", autoLogin: false };
    const { data, error } = await supabase.auth.signUp({ email, password });
    // セッションが返れば（メール確認OFF）即ログイン状態
    return { error: error?.message ?? null, autoLogin: !!data.session };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "認証が設定されていません" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
