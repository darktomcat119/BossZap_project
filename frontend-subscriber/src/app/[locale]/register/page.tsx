'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const localeLabels: Record<string, string> = {
  es: 'ES',
  en: 'EN',
  'pt-BR': 'PT',
};

const locales = ['es', 'en', 'pt-BR'] as const;

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { register } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const switchLocale = (locale: string) => {
    router.replace(pathname, { locale: locale as any });
    setLangMenuOpen(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = t('fieldRequired');
    if (!email.trim()) {
      newErrors.email = t('fieldRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('invalidEmail');
    }
    if (!phone.trim()) newErrors.phone = t('fieldRequired');
    if (!password) newErrors.password = t('fieldRequired');
    if (!confirmPassword) {
      newErrors.confirmPassword = t('fieldRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        phone,
        password,
        owner_name: name,
        email,
      });
      router.push('/dashboard');
    } catch {
      setGlobalError(t('registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Language switcher — top right */}
      <div className="flex justify-end p-4">
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface"
            aria-label="Switch language"
          >
            <Globe className="h-4 w-4" />
          </button>

          {langMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLangMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-50 mt-1 w-32 rounded-lg border border-border bg-surface py-1 shadow-lg">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => switchLocale(locale)}
                    className={cn(
                      'flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-background',
                      'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {localeLabels[locale]}
                    {locale === 'pt-BR' && (
                      <span className="ml-1 text-text-muted">(Brasil)</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo / App name */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">
              {tCommon('appName')}
            </h1>
          </div>

          {/* Card */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-center text-xl font-semibold text-text-primary">
              {t('register')}
            </h2>

            {/* Global error */}
            {globalError && (
              <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-text-secondary"
                >
                  {t('name')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                    errors.name
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-primary focus:ring-primary'
                  )}
                  placeholder={t('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-danger">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-text-secondary"
                >
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                    errors.email
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-primary focus:ring-primary'
                  )}
                  placeholder={t('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm font-medium text-text-secondary"
                >
                  {t('phone')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                    errors.phone
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-primary focus:ring-primary'
                  )}
                  placeholder={t('phoneHint')}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-danger">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-text-secondary"
                >
                  {t('password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                    errors.password
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-primary focus:ring-primary'
                  )}
                  placeholder={t('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-sm font-medium text-text-secondary"
                >
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1',
                    errors.confirmPassword
                      ? 'border-danger focus:border-danger focus:ring-danger'
                      : 'border-border focus:border-primary focus:ring-primary'
                  )}
                  placeholder={t('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? tCommon('loading') : t('createAccount')}
              </button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-text-secondary">
              {t('alreadyHaveAccount')}{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
