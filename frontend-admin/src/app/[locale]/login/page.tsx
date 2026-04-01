'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, Shield, Mail, Lock } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { ParticleCanvas } from '@/components/shared/particle-canvas';

export default function LoginPage() {
  const t = useTranslations('auth');
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try { await login(email, password); }
    catch { setError(t('loginError')); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0f24] via-[#1a1a2e] to-[#151530] px-4">
      <ParticleCanvas
        particleCount={50}
        color="108, 92, 231"
        maxDistance={130}
        speed={0.2}
        orbColors={["108, 92, 231", "0, 212, 170", "9, 132, 227"]}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto h-44 w-44 rounded-full bg-white/15 blur-[80px]" />
            <Image src="/bosszap_logo.png" alt="BossZap Admin" width={180} height={189} className="relative h-36 w-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" priority />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Shield className="h-5 w-5 text-[#8b7cf7]" />
            <h2 className="text-xl font-semibold text-white/90">{t('brandTitle')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/50">{t('email')}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                <input id="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition-all focus:border-[#8b7cf7]/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#8b7cf7]/20" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/50">{t('password')}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" placeholder={t('passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/25 transition-all focus:border-[#8b7cf7]/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#8b7cf7]/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={submitting} className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8b7cf7] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6C5CE7]/30 transition-all hover:shadow-xl hover:shadow-[#6C5CE7]/40 active:scale-[0.98] disabled:opacity-50">
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('login')}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-white/15">BossZap Admin Panel &mdash; Restricted Access</p>
      </div>
    </div>
  );
}
