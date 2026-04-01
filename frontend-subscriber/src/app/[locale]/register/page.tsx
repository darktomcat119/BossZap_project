'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Globe, Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { ParticleCanvas } from '@/components/shared/particle-canvas';
import { cn } from '@/lib/utils';

const localeLabels: Record<string, string> = { es: 'ES', en: 'EN', 'pt-BR': 'PT' };
const locales = ['es', 'en', 'pt-BR'] as const;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const { register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const switchLocale = (locale: string) => {
    router.replace(pathname, { locale: locale as any });
    setLangMenuOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(t('passwordMismatch')); return; }
    setLoading(true);
    try { await register({ name, email, phone, password }); router.push('/dashboard'); }
    catch { setError(t('registerError')); }
    finally { setLoading(false); }
  };

  const inputBase = "w-full rounded-xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 transition-all focus:border-primary/60 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-primary/20";
  const iconBase = "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#0f1628] via-[#1a1f36] to-[#12182e]">
      <ParticleCanvas particleCount={70} color="0, 212, 170" maxDistance={140} speed={0.25} />

      {/* Language */}
      <div className="relative z-50 flex justify-end p-4 sm:p-6">
        <div className="relative">
          <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white/80">
            <Globe className="h-4 w-4" />
          </button>
          {langMenuOpen && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setLangMenuOpen(false)} />
              <div className="absolute right-0 z-[70] mt-2 w-36 overflow-hidden rounded-xl border border-white/15 bg-[#252b48]/95 py-1 shadow-2xl backdrop-blur-xl">
                {locales.map((l) => (
                  <button key={l} onClick={() => switchLocale(l)} className="flex w-full items-center px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">{localeLabels[l]}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="relative mb-8 flex justify-center">
            <div className="absolute inset-0 m-auto h-44 w-44 rounded-full bg-white/15 blur-[80px]" />
            <Image src="/bosszap_logo.png" alt="BossZap" width={180} height={189} className="relative h-36 w-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" priority />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <h2 className="mb-6 text-center text-xl font-semibold text-white/90">{t('register')}</h2>

            {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white/50">{t('name')}</label>
                <div className="relative">
                  <User className={iconBase} />
                  <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputBase} placeholder={t('name')} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-white/50">{t('email')}</label>
                <div className="relative">
                  <Mail className={iconBase} />
                  <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} placeholder={t('email')} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-white/50">{t('phone')}</label>
                <div className="relative">
                  <Phone className={iconBase} />
                  <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputBase} placeholder="+55 11 99999-0000" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-white/50">{t('password')}</label>
                <div className="relative">
                  <Lock className={iconBase} />
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={cn(inputBase, "pr-11")} placeholder={t('passwordHint')} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-white/50">{t('confirmPassword')}</label>
                <div className="relative">
                  <Lock className={iconBase} />
                  <input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBase} placeholder={t('confirmPassword')} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[#00c49a] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('register')}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/25">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="mt-4 text-center text-sm text-white/40">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">{t('login')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
