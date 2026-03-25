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

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setLoading(true);

    try {
      await login({ phone: email, password });
      router.push('/dashboard');
    } catch {
      setError(t('loginError'));
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
              {t('login')}
            </h2>

            {/* Error toast */}
            {error && (
              <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={t('email')}
                />
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={t('password')}
                />
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? tCommon('loading') : t('login')}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-text-secondary">
              {t('noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
