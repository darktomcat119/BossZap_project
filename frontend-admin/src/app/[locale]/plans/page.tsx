'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, X, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { plansApi } from '@/lib/api';
import type { Plan, PlanFormData } from '@/lib/types';

const extract = (res: any) => res?.data ?? res;

const emptyForm: PlanFormData = {
  name: '',
  price: 0,
  max_budgets: 0,
  max_messages: 0,
  max_ai_calls: 0,
  trial_days: 0,
};

function PlanSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-border p-md space-y-md animate-pulse">
      <div className="h-5 w-20 bg-gray-200 rounded" />
      <div className="h-8 w-24 bg-gray-200 rounded" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function PlansPage() {
  const t = useTranslations('plans');
  const tc = useTranslations('common');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await plansApi.list();
      const rows = extract(raw);
      setPlans(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      max_budgets: plan.max_budgets,
      max_messages: plan.max_messages,
      max_ai_calls: plan.max_ai_calls,
      trial_days: plan.trial_days,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await plansApi.update(editingId, form);
      } else {
        await plansApi.create(form);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await plansApi.deactivate(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const updateField = (field: keyof PlanFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (error && !loading && plans.length === 0) {
    return (
      <div className="p-md lg:p-lg flex flex-col items-center justify-center gap-md min-h-[50vh]">
        <p className="text-body text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {tc('retry') ?? 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-md lg:p-lg space-y-md">
        <div className="flex items-center justify-between">
          <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('createPlan')}
          </button>
        </div>

        {error && plans.length > 0 && (
          <div className="p-sm rounded-button bg-red-50 text-red-600 text-body">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)
            : plans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'bg-surface rounded-card border border-border p-md space-y-md',
                    !plan.is_active && 'opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-h4 font-semibold text-text-primary">{plan.name}</h3>
                      <p className="text-h3 font-bold text-primary">
                        ${plan.price}<span className="text-body font-normal text-text-secondary">{t('perMonth')}</span>
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-caption font-medium',
                        plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {plan.is_active ? tc('active') : tc('inactive')}
                    </span>
                  </div>

                  <div className="space-y-xs text-body text-text-secondary">
                    <div className="flex justify-between">
                      <span>{t('maxBudgets')}</span>
                      <span className="font-medium text-text-primary">{plan.max_budgets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('maxMessages')}</span>
                      <span className="font-medium text-text-primary">{plan.max_messages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('maxAiCalls')}</span>
                      <span className="font-medium text-text-primary">{plan.max_ai_calls.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('trialDays')}</span>
                      <span className="font-medium text-text-primary">{plan.trial_days}</span>
                    </div>
                  </div>

                  {plan.subscriber_count !== undefined && (
                    <div className="flex items-center gap-xs text-caption text-text-secondary">
                      <Users className="w-4 h-4" />
                      <span>{plan.subscriber_count} {t('subscriberCount').toLowerCase()}</span>
                    </div>
                  )}

                  <div className="flex gap-sm pt-xs border-t border-border">
                    <button
                      onClick={() => openEdit(plan)}
                      className="flex items-center gap-xs px-3 py-1.5 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {tc('edit')}
                    </button>
                    {plan.is_active && (
                      <button
                        onClick={() => handleDeactivate(plan.id)}
                        className="flex-1 py-1.5 rounded-button text-body font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        {t('deactivatePlan')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {!loading && plans.length === 0 && (
          <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
            <div className="bg-surface rounded-card border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-md border-b border-border">
                <h2 className="text-h4 font-semibold text-text-primary">
                  {editingId ? t('editPlan') : t('createPlan')}
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
                  <label className="block text-caption font-medium text-text-secondary mb-xs">{t('planName')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-caption font-medium text-text-secondary mb-xs">{t('price')} (USD)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('maxBudgets')}</label>
                    <input
                      type="number"
                      value={form.max_budgets}
                      onChange={(e) => updateField('max_budgets', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('maxMessages')}</label>
                    <input
                      type="number"
                      value={form.max_messages}
                      onChange={(e) => updateField('max_messages', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('maxAiCalls')}</label>
                    <input
                      type="number"
                      value={form.max_ai_calls}
                      onChange={(e) => updateField('max_ai_calls', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('trialDays')}</label>
                    <input
                      type="number"
                      value={form.trial_days}
                      onChange={(e) => updateField('trial_days', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
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
                  {saving ? tc('saving') ?? 'Saving...' : tc('save')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
