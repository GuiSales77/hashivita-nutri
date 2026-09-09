import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { AUTH_CALLBACK_URL } from '../services/authRedirect';

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  age: number | null;
  sex: 'homem' | 'mulher' | null;
  ageRange: 'ate-18' | '19-50' | '50+' | null;
  hasHashimoto: boolean;
  hashimotoMedicationTime: string | null;
  healthConditions: string[];
  onboarded: boolean;
  avatarUrl: string | null;
};

type SignupResult = { ok: true; needsEmailConfirmation: boolean } | { ok: false; error: string };
type LoginResult = 'ok' | 'nao_encontrado' | 'senha_incorreta' | 'email_nao_confirmado' | { erro: string };

type AuthContextValue = {
  session: Session | null;
  appUser: AppUser | null;
  loading: boolean;
  signup: (data: { fullName: string; email: string; password: string }) => Promise<SignupResult>;
  login: (email: string, password: string) => Promise<LoginResult>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: Partial<AppUser>) => Promise<void>;
  updateHealthInfo: (data: Partial<AppUser>) => Promise<void>;
  refreshAppUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAppUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('app_user').select('*').eq('id', userId).maybeSingle();
    if (error || !data) {
      setAppUser(null);
      return;
    }
    setAppUser({
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
      age: data.age,
      sex: data.sex,
      ageRange: data.age_range,
      hasHashimoto: data.has_hashimoto,
      hashimotoMedicationTime: data.hashimoto_medication_time,
      healthConditions: data.health_conditions ?? [],
      onboarded: data.onboarded,
      avatarUrl: data.avatar_url ?? null,
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadAppUser(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadAppUser(newSession.user.id);
      } else {
        setAppUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadAppUser]);

  const signup = useCallback(async ({ fullName, email, password }: { fullName: string; email: string; password: string }): Promise<SignupResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: AUTH_CALLBACK_URL },
    });
    if (error) return { ok: false, error: error.message };
    // Se "Confirm email" estiver ativado no Supabase, data.session vem null aqui —
    // a linha em app_user já foi criada pelo trigger handle_new_user() no banco,
    // com full_name preenchido a partir do metadata acima.
    const needsEmailConfirmation = !data.session;
    return { ok: true, needsEmailConfirmation };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return 'ok';
    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed')) return 'email_nao_confirmado';
    if (msg.includes('invalid login credentials')) return 'senha_incorreta';
    return { erro: error.message };
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: AUTH_CALLBACK_URL } });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Onboarding e edição no Perfil gravam nas mesmas colunas; só o onboarding
  // vira a chave `onboarded`. O erro precisa subir: antes ele era descartado, e
  // um update que falhasse (RLS, rede) deixava o usuário seguir com o perfil em
  // branco e onboarded=false, sem nenhum aviso.
  const salvarDadosDeSaude = useCallback(
    async (data: Partial<AppUser>, marcarOnboarded: boolean) => {
      if (!session) throw new Error('Sessão expirada. Entre novamente.');
      const { error } = await supabase
        .from('app_user')
        .update({
          age: data.age,
          sex: data.sex,
          age_range: data.ageRange,
          has_hashimoto: data.hasHashimoto,
          hashimoto_medication_time: data.hashimotoMedicationTime,
          health_conditions: data.healthConditions,
          ...(marcarOnboarded ? { onboarded: true } : {}),
          updated_date: new Date().toISOString(),
        })
        .eq('id', session.user.id);
      if (error) throw new Error(error.message);
      await loadAppUser(session.user.id);
    },
    [session, loadAppUser]
  );

  const completeOnboarding = useCallback(
    (data: Partial<AppUser>) => salvarDadosDeSaude(data, true),
    [salvarDadosDeSaude]
  );

  const updateHealthInfo = useCallback(
    (data: Partial<AppUser>) => salvarDadosDeSaude(data, false),
    [salvarDadosDeSaude]
  );

  const refreshAppUser = useCallback(async () => {
    if (session) await loadAppUser(session.user.id);
  }, [session, loadAppUser]);

  return (
    <AuthContext.Provider
      value={{ session, appUser, loading, signup, login, resendConfirmationEmail, logout, completeOnboarding, updateHealthInfo, refreshAppUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
