'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subscriber, SubscriberStatus } from '@/lib/types';

const mockSubscribers: Subscriber[] = [
  { id: '1', name: 'Carlos Mendez', phone: '+52 55 1234 5678', status: 'active', plan: 'Pro', messages: 1240, revenue: 890, joinedAt: '2025-06-15', lastActive: '2026-03-24' },
  { id: '2', name: 'Ana Silva', phone: '+55 11 9876 5432', status: 'active', plan: 'Enterprise', messages: 3420, revenue: 2450, joinedAt: '2025-04-20', lastActive: '2026-03-24' },
  { id: '3', name: 'Roberto Lima', phone: '+55 21 5555 1234', status: 'suspended', plan: 'Basic', messages: 320, revenue: 180, joinedAt: '2025-09-10', lastActive: '2026-03-20' },
  { id: '4', name: 'María García', phone: '+52 33 4444 5555', status: 'active', plan: 'Pro', messages: 890, revenue: 640, joinedAt: '2025-07-01', lastActive: '2026-03-23' },
  { id: '5', name: 'Pedro Santos', phone: '+55 31 6666 7777', status: 'inactive', plan: 'Basic', messages: 45, revenue: 30, joinedAt: '2025-11-05', lastActive: '2026-01-15' },
  { id: '6', name: 'Laura Hernández', phone: '+52 81 8888 9999', status: 'active', plan: 'Enterprise', messages: 5600, revenue: 4200, joinedAt: '2025-03-12', lastActive: '2026-03-24' },
  { id: '7', name: 'Diego Ferreira', phone: '+55 41 1111 2222', status: 'active', plan: 'Pro', messages: 2100, revenue: 1500, joinedAt: '2025-05-28', lastActive: '2026-03-24' },
  { id: '8', name: 'Camila Rojas', phone: '+52 55 3333 4444', status: 'suspended', plan: 'Basic', messages: 200, revenue: 120, joinedAt: '2025-10-18', lastActive: '2026-02-28' },
  { id: '9', name: 'Fernando Oliveira', phone: '+55 11 5555 6666', status: 'active', plan: 'Pro', messages: 1800, revenue: 1300, joinedAt: '2025-08-22', lastActive: '2026-03-23' },
  { id: '10', name: 'Valentina López', phone: '+52 33 7777 8888', status: 'active', plan: 'Enterprise', messages: 4200, revenue: 3100, joinedAt: '2025-04-05', lastActive: '2026-03-24' },
  { id: '11', name: 'Bruno Costa', phone: '+55 21 9999 0000', status: 'inactive', plan: 'Basic', messages: 15, revenue: 10, joinedAt: '2026-01-10', lastActive: '2026-02-01' },
  { id: '12', name: 'Isabela Martínez', phone: '+52 81 2222 3333', status: 'active', plan: 'Pro', messages: 960, revenue: 700, joinedAt: '2025-09-30', lastActive: '2026-03-24' },
];

const PAGE_SIZE = 8;

const statusColors: Record<SubscriberStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

export default function SubscribersPage() {
  const t = useTranslations('subscribers');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockSubscribers.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = mockSubscribers.find((s) => s.id === selectedId);

  return (
    <AdminShell>
      <div className="p-md lg:p-lg space-y-md">
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{tc('all')}</option>
            <option value="active">{tc('active')}</option>
            <option value="inactive">{tc('inactive')}</option>
            <option value="suspended">{tc('suspended')}</option>
          </select>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface rounded-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{tc('name')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('phone')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{tc('status')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('plan')}</th>
                  <th className="text-right px-md py-sm font-medium text-text-secondary">{t('messages')}</th>
                  <th className="text-right px-md py-sm font-medium text-text-secondary">{t('revenue')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('joined')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => setSelectedId(sub.id)}
                    className="border-b border-border last:border-0 hover:bg-background cursor-pointer transition-colors"
                  >
                    <td className="px-md py-sm font-medium text-text-primary">{sub.name}</td>
                    <td className="px-md py-sm text-text-secondary">{sub.phone}</td>
                    <td className="px-md py-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[sub.status])}>
                        {tc(sub.status)}
                      </span>
                    </td>
                    <td className="px-md py-sm text-text-secondary">{sub.plan}</td>
                    <td className="px-md py-sm text-right text-text-secondary">{sub.messages.toLocaleString()}</td>
                    <td className="px-md py-sm text-right text-text-secondary">${sub.revenue.toLocaleString()}</td>
                    <td className="px-md py-sm text-text-secondary">{sub.joinedAt}</td>
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
          {paginated.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelectedId(sub.id)}
              className="bg-surface rounded-card border border-border p-md space-y-xs cursor-pointer active:bg-background transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-text-primary">{sub.name}</p>
                <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[sub.status])}>
                  {tc(sub.status)}
                </span>
              </div>
              <p className="text-caption text-text-secondary">{sub.phone}</p>
              <div className="flex justify-between text-caption text-text-secondary">
                <span>{sub.plan}</span>
                <span>{sub.messages.toLocaleString()} {t('messages').toLowerCase()}</span>
                <span>${sub.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-caption text-text-secondary">
              {tc('showing')} {(page - 1) * PAGE_SIZE + 1} {tc('to')}{' '}
              {Math.min(page * PAGE_SIZE, filtered.length)} {tc('of')} {filtered.length} {tc('entries')}
            </p>
            <div className="flex items-center gap-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-button border border-border bg-surface hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-caption text-text-secondary px-2">
                {tc('page')} {page} {tc('of')} {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-button border border-border bg-surface hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail side panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setSelectedId(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-md border-b border-border">
              <h2 className="text-h4 font-semibold text-text-primary">{t('subscriberDetails')}</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-button hover:bg-background"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              <div>
                <p className="text-caption text-text-secondary">{tc('name')}</p>
                <p className="text-body font-medium text-text-primary">{selected.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary">{t('phone')}</p>
                <p className="text-body text-text-primary">{selected.phone}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary">{tc('status')}</p>
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-caption font-medium', statusColors[selected.status])}>
                  {tc(selected.status)}
                </span>
              </div>
              <div>
                <p className="text-caption text-text-secondary">{t('plan')}</p>
                <p className="text-body text-text-primary">{selected.plan}</p>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-caption text-text-secondary">{t('totalMessages')}</p>
                  <p className="text-h4 font-bold text-text-primary">{selected.messages.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-caption text-text-secondary">{t('totalRevenue')}</p>
                  <p className="text-h4 font-bold text-text-primary">${selected.revenue.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-caption text-text-secondary">{t('lastActive')}</p>
                <p className="text-body text-text-primary">{selected.lastActive}</p>
              </div>
              <div>
                <p className="text-caption text-text-secondary">{t('joined')}</p>
                <p className="text-body text-text-primary">{selected.joinedAt}</p>
              </div>
            </div>
            <div className="p-md border-t border-border flex gap-sm">
              {selected.status !== 'active' && (
                <button className="flex-1 py-2 rounded-button bg-green-600 text-white text-body font-medium hover:bg-green-700 transition-colors">
                  {tc('activate')}
                </button>
              )}
              {selected.status === 'active' && (
                <button className="flex-1 py-2 rounded-button bg-amber-500 text-white text-body font-medium hover:bg-amber-600 transition-colors">
                  {tc('suspend')}
                </button>
              )}
              {selected.status !== 'inactive' && (
                <button className="flex-1 py-2 rounded-button bg-red-600 text-white text-body font-medium hover:bg-red-700 transition-colors">
                  {tc('deactivate')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
