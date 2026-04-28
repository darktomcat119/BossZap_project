'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { templatesApi } from '@/lib/api';
import { formatTemplateStatus, formatTemplateCategory } from '@/lib/format';
import type { HsmTemplate, TemplateFormData, TemplateStatus } from '@/lib/types';

const extract = (res: any) => res?.data ?? res;

const statusColors: Record<TemplateStatus, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};

const emptyForm: TemplateFormData = {
  name: '',
  language: 'pt-BR',
  category: 'utility',
  body: '',
};

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-md">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  const t = useTranslations('templates');
  const tc = useTranslations('common');

  const [templates, setTemplates] = useState<HsmTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [langFilter, setLangFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await templatesApi.list();
      const result = extract(raw);
      setTemplates(Array.isArray(result) ? result as HsmTemplate[] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchLang = langFilter === 'all' || tmpl.language === langFilter;
      const matchCat = catFilter === 'all' || tmpl.category === catFilter;
      return matchLang && matchCat;
    });
  }, [templates, langFilter, catFilter]);

  const languages = useMemo(
    () => Array.from(new Set(templates.map((tmpl) => tmpl.language))),
    [templates]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tmpl: HsmTemplate) => {
    setEditingId(tmpl.id);
    setForm({
      name: tmpl.name,
      language: tmpl.language,
      category: tmpl.category,
      body: tmpl.body,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await templatesApi.update(editingId, form);
      } else {
        await templatesApi.create(form);
      }
      setModalOpen(false);
      await fetchData();
      toast.success(tc('saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof TemplateFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className="p-md lg:p-lg flex flex-col items-center justify-center gap-md min-h-[50vh]">
        <p className="text-body text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-md lg:p-lg space-y-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('createTemplate')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-sm">
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t('filterByLanguage')}</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t('filterByCategory')}</option>
            <option value="marketing">{t('marketing')}</option>
            <option value="utility">{t('utility')}</option>
            <option value="authentication">{t('authentication')}</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-surface rounded-card border border-border overflow-hidden">
            <TableSkeleton />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-surface rounded-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-body">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('templateName')}</th>
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('language')}</th>
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('category')}</th>
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('metaStatus')}</th>
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('body')}</th>
                      <th className="text-left px-md py-sm font-medium text-text-secondary"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tmpl) => (
                      <tr key={tmpl.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                        <td className="px-md py-sm font-medium text-text-primary font-mono text-caption">{tmpl.name}</td>
                        <td className="px-md py-sm text-text-secondary">{tmpl.language}</td>
                        <td className="px-md py-sm">
                          <span className="px-2 py-0.5 rounded-full text-caption font-medium bg-gray-100 text-gray-700">
                            {formatTemplateCategory(tmpl.category)}
                          </span>
                        </td>
                        <td className="px-md py-sm">
                          <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[tmpl.meta_status] ?? 'bg-gray-100 text-gray-600')}>
                            {formatTemplateStatus(tmpl.meta_status)}
                          </span>
                        </td>
                        <td className="px-md py-sm text-text-secondary text-caption max-w-xs truncate">{tmpl.body}</td>
                        <td className="px-md py-sm">
                          <button
                            onClick={() => openEdit(tmpl)}
                            className="p-1 rounded hover:bg-background"
                          >
                            <Pencil className="w-3.5 h-3.5 text-text-secondary" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
              )}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-sm">
              {filtered.map((tmpl) => (
                <div key={tmpl.id} className="bg-surface rounded-card border border-border p-md space-y-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-caption font-medium text-text-primary">{tmpl.name}</p>
                    <div className="flex items-center gap-xs">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[tmpl.meta_status] ?? 'bg-gray-100 text-gray-600')}>
                        {formatTemplateStatus(tmpl.meta_status)}
                      </span>
                      <button
                        onClick={() => openEdit(tmpl)}
                        className="p-1 rounded hover:bg-background"
                      >
                        <Pencil className="w-3.5 h-3.5 text-text-secondary" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-sm text-caption text-text-secondary">
                    <span>{tmpl.language}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                      {formatTemplateCategory(tmpl.category)}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary line-clamp-2">{tmpl.body}</p>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
            <div className="bg-surface rounded-card border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-md border-b border-border">
                <h2 className="text-h4 font-semibold text-text-primary">
                  {editingId ? tc('edit') : t('createTemplate')}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-button hover:bg-background"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="p-md space-y-md">
                <div>
                  <label className="block text-caption font-medium text-text-secondary mb-xs">{t('templateName')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. welcome_message"
                    className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('language')}</label>
                    <select
                      value={form.language}
                      onChange={(e) => updateField('language', e.target.value)}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="pt-BR">pt-BR</option>
                      <option value="es">es</option>
                      <option value="en">en</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('category')}</label>
                    <select
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="marketing">{t('marketing')}</option>
                      <option value="utility">{t('utility')}</option>
                      <option value="authentication">{t('authentication')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-caption font-medium text-text-secondary mb-xs">{t('body')}</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => updateField('body', e.target.value)}
                    rows={4}
                    placeholder="Use {{1}}, {{2}} for variables"
                    className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-sm p-md border-t border-border">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors"
                >
                  {tc('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {t('submitForReview')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
