'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { User, Mail, Globe, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type Profile = {
  id: string;
  email: string;
  role: string;
  preferred_language: string;
  created_at: string;
};

const extract = <T,>(res: unknown): T => {
  const r = res as { data?: T } | T;
  return (r && typeof r === 'object' && 'data' in r ? (r as { data: T }).data : r) as T;
};

const LANG_LABELS: Record<string, string> = {
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  en: 'English',
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await profileApi.get();
      const data = extract<Profile>(raw);
      setProfile(data);
      setEmail(data.email);
      setLanguage(data.preferred_language);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const payload: { email?: string; preferred_language?: string } = {};
      if (email !== profile.email) payload.email = email;
      if (language !== profile.preferred_language) payload.preferred_language = language;
      if (Object.keys(payload).length === 0) {
        toast.info(t('nothingToSave'));
        return;
      }
      const raw = await profileApi.update(payload);
      const data = extract<Profile>(raw);
      setProfile(data);
      toast.success(t('saveSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 8) {
      toast.error(t('minLengthError'));
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error(t('mismatchError'));
      return;
    }
    setSavingPassword(true);
    try {
      await profileApi.changePassword(currentPwd, newPwd);
      toast.success(t('changeSuccess'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('changeError'));
    } finally {
      setSavingPassword(false);
    }
  };

  const initial = (profile?.email ?? 'A').charAt(0).toUpperCase();

  return (
    <div className="p-md lg:p-lg space-y-md max-w-3xl">
      <div>
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
        <p className="text-caption text-text-secondary mt-1">{t('subtitle')}</p>
      </div>

      {loading ? (
        <div className="space-y-md">
          <div className="bg-surface rounded-card border border-border p-md animate-pulse h-32" />
          <div className="bg-surface rounded-card border border-border p-md animate-pulse h-48" />
        </div>
      ) : profile ? (
        <>
          {/* Identity card */}
          <div className="bg-surface rounded-card border border-border p-lg">
            <div className="flex items-start gap-md">
              <span className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-h3 font-bold shrink-0">
                {initial}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="text-h4 font-semibold text-text-primary">
                  {profile.email}
                </h2>
                <p className="text-caption text-text-secondary mt-1">
                  {t('role')}: <span className="font-medium text-text-primary">{profile.role}</span>
                </p>
                <p className="text-caption text-text-secondary">
                  {t('memberSince')} {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-surface rounded-card border border-border p-lg space-y-md">
            <div className="flex items-center gap-sm">
              <User className="w-5 h-5 text-text-secondary" />
              <h2 className="text-h4 font-semibold text-text-primary">{t('infoSection')}</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-md">
              <div>
                <label className="block text-caption font-medium text-text-secondary mb-xs">
                  <Mail className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-caption font-medium text-text-secondary mb-xs">
                  <Globe className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {t('language')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(LANG_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-sm border-t border-border">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? t('saving') : t('save')}
              </button>
            </div>
          </div>

          {/* Password change */}
          <div className="bg-surface rounded-card border border-border p-lg space-y-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <Lock className="w-5 h-5 text-text-secondary" />
                <h2 className="text-h4 font-semibold text-text-primary">{t('passwordSection')}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="flex items-center gap-xs text-caption text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPwd ? t('hide') : t('show')}
              </button>
            </div>

            <div className="space-y-md">
              <div>
                <label className="block text-caption font-medium text-text-secondary mb-xs">
                  {t('currentPassword')}
                </label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-md">
                <div>
                  <label className="block text-caption font-medium text-text-secondary mb-xs">
                    {t('newPassword')}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    autoComplete="new-password"
                    className={cn(
                      'w-full px-3 py-2 rounded-button border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
                      newPwd && newPwd.length < 8 ? 'border-red-300' : 'border-border',
                    )}
                  />
                  <p className="text-caption text-text-secondary mt-xs">{t('passwordHint')}</p>
                </div>
                <div>
                  <label className="block text-caption font-medium text-text-secondary mb-xs">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    autoComplete="new-password"
                    className={cn(
                      'w-full px-3 py-2 rounded-button border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
                      confirmPwd && confirmPwd !== newPwd ? 'border-red-300' : 'border-border',
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-sm border-t border-border">
              <button
                onClick={handleChangePassword}
                disabled={
                  savingPassword || !currentPwd || newPwd.length < 8 || newPwd !== confirmPwd
                }
                className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? t('changing') : t('changePassword')}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
