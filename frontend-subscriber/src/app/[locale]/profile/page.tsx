'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Upload,
  Save,
  Building2,
  CreditCard,
  CheckCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { profileService } from '@/services/profile.service';
import type { ProfileUpdate } from '@/lib/types';

// ── Constants ───────────────────────────────────────────────
const LANGUAGES = [
  { value: 'pt-BR', label: 'Portugues (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-danger/10 text-danger',
  trial: 'bg-warning/10 text-warning',
};

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

// ── Skeleton ────────────────────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-border/50',
        className,
      )}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <SkeletonBlock className="h-8 w-48" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <SkeletonBlock className="h-5 w-40" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SkeletonBlock className="h-10 sm:col-span-2" />
              <SkeletonBlock className="h-10" />
              <SkeletonBlock className="h-10" />
              <SkeletonBlock className="h-10 sm:col-span-2" />
              <SkeletonBlock className="h-10" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <SkeletonBlock className="h-5 w-24" />
            <div className="mt-4 flex items-center gap-4">
              <SkeletonBlock className="h-24 w-24 shrink-0 rounded-xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-48" />
                <SkeletonBlock className="h-9 w-32" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-3 h-10 w-48" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <SkeletonBlock className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-5" />
              <SkeletonBlock className="h-5" />
              <SkeletonBlock className="h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ────────────────────────────────────────────
export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, loading } = useAuth();

  // Form state — populated from user once loaded
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [language, setLanguage] = useState('pt-BR');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate form when user loads
  useEffect(() => {
    if (!user) return;
    setBusinessName(user.business_name ?? '');
    setOwnerName(user.owner_name ?? '');
    setEmail(user.email ?? '');
    setPhone(user.phone ?? '');
    setAddress(user.address ?? '');
    setLanguage(user.preferred_language ?? 'pt-BR');
  }, [user]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    const payload: ProfileUpdate = {
      business_name: businessName,
      owner_name: ownerName,
      email,
      address,
      preferred_language: language,
    };

    try {
      const res = await profileService.updateProfile(payload);
      // eslint-disable-next-line no-console
      console.log('[ProfilePage] updateProfile response:', res);
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ProfilePage] updateProfile error:', err);
    } finally {
      setSaving(false);
    }
  }, [businessName, ownerName, email, address, language]);

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Derive subscription info from user
  const planName = user?.plan?.name ?? t('noPlan');
  const subStatus = user?.status ?? 'inactive';
  const statusStyle = STATUS_STYLES[subStatus] ?? STATUS_STYLES.inactive;

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t('title')}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left column: Business info, Logo, Language ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Business info form */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('businessInfo')}
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Business name */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('businessName')}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Owner name */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('ownerName')}
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Phone (read-only — primary identifier) */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    readOnly
                    className={cn(INPUT_CLASS, 'cursor-not-allowed opacity-60')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                    {t('address')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* Logo section */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">
                {t('logo')}
              </h2>
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                {user?.logo_url ? (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-border">
                    <Image
                      src={user.logo_url}
                      alt={businessName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background">
                    <User className="h-10 w-10 text-text-muted" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-text-secondary">
                    {t('logoHint')}
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface"
                  >
                    <Upload className="h-4 w-4" />
                    {user?.logo_url ? t('changeLogo') : t('uploadLogo')}
                  </button>
                </div>
              </div>
            </div>

            {/* Language preference */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text-primary">
                {t('languagePreference')}
              </h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={cn(INPUT_CLASS, 'mt-3 sm:w-48')}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors sm:w-auto sm:py-2.5',
                saved
                  ? 'bg-success'
                  : 'bg-primary hover:bg-primary-dark',
                saving && 'opacity-60',
              )}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t('saved')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {saving ? t('saving') : t('saveChanges')}
                </>
              )}
            </button>
          </div>

          {/* ── Right column: Subscription ── */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t('subscription')}
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {/* Plan */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {t('plan')}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {planName}
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {t('status')}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusStyle,
                    )}
                  >
                    {t(subStatus as 'active' | 'inactive' | 'trial')}
                  </span>
                </div>

                {/* Next billing — placeholder until billing API exists */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    {t('nextBilling')}
                  </span>
                  <span className="text-sm text-text-primary">--</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
