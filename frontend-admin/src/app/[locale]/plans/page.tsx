'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { Plus, Pencil, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Plan, PlanFormData } from '@/lib/types';

const mockPlans: Plan[] = [
  { id: '1', name: 'Basic', price: 29, maxBudgets: 3, maxMessages: 500, maxAiCalls: 100, trialDays: 7, active: true, subscriberCount: 45 },
  { id: '2', name: 'Pro', price: 89, maxBudgets: 10, maxMessages: 2000, maxAiCalls: 500, trialDays: 14, active: true, subscriberCount: 112 },
  { id: '3', name: 'Enterprise', price: 199, maxBudgets: 50, maxMessages: 10000, maxAiCalls: 2000, trialDays: 30, active: true, subscriberCount: 57 },
  { id: '4', name: 'Starter', price: 15, maxBudgets: 1, maxMessages: 100, maxAiCalls: 25, trialDays: 3, active: false, subscriberCount: 0 },
];

const emptyForm: PlanFormData = {
  name: '',
  price: 0,
  maxBudgets: 0,
  maxMessages: 0,
  maxAiCalls: 0,
  trialDays: 0,
};

export default function PlansPage() {
  const t = useTranslations('plans');
  const tc = useTranslations('common');

  const [plans, setPlans] = useState(mockPlans);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);

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
      maxBudgets: plan.maxBudgets,
      maxMessages: plan.maxMessages,
      maxAiCalls: plan.maxAiCalls,
      trialDays: plan.trialDays,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
      );
    } else {
      setPlans((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...form,
          active: true,
          subscriberCount: 0,
        },
      ]);
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const updateField = (field: keyof PlanFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminShell>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'bg-surface rounded-card border border-border p-md space-y-md',
                !plan.active && 'opacity-60'
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
                    plan.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {plan.active ? tc('active') : tc('inactive')}
                </span>
              </div>

              <div className="space-y-xs text-body text-text-secondary">
                <div className="flex justify-between">
                  <span>{t('maxBudgets')}</span>
                  <span className="font-medium text-text-primary">{plan.maxBudgets}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('maxMessages')}</span>
                  <span className="font-medium text-text-primary">{plan.maxMessages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('maxAiCalls')}</span>
                  <span className="font-medium text-text-primary">{plan.maxAiCalls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('trialDays')}</span>
                  <span className="font-medium text-text-primary">{plan.trialDays}</span>
                </div>
              </div>

              <div className="flex items-center gap-xs text-caption text-text-secondary">
                <Users className="w-4 h-4" />
                <span>{plan.subscriberCount} {t('subscriberCount').toLowerCase()}</span>
              </div>

              <div className="flex gap-sm pt-xs border-t border-border">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex items-center gap-xs px-3 py-1.5 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {tc('edit')}
                </button>
                <button
                  onClick={() => toggleActive(plan.id)}
                  className={cn(
                    'flex-1 py-1.5 rounded-button text-body font-medium transition-colors',
                    plan.active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  )}
                >
                  {plan.active ? t('deactivatePlan') : t('activatePlan')}
                </button>
              </div>
            </div>
          ))}
        </div>
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
                      value={form.maxBudgets}
                      onChange={(e) => updateField('maxBudgets', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('maxMessages')}</label>
                    <input
                      type="number"
                      value={form.maxMessages}
                      onChange={(e) => updateField('maxMessages', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-md">
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('maxAiCalls')}</label>
                    <input
                      type="number"
                      value={form.maxAiCalls}
                      onChange={(e) => updateField('maxAiCalls', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-caption font-medium text-text-secondary mb-xs">{t('trialDays')}</label>
                    <input
                      type="number"
                      value={form.trialDays}
                      onChange={(e) => updateField('trialDays', Number(e.target.value))}
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
                  className="px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
                >
                  {tc('save')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
