'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribersApi } from '@/lib/api';
import type { Subscriber, PaginatedResponse } from '@/lib/types';

const PAGE_SIZE = 8;

const extract = (res: any): PaginatedResponse<Subscriber> => res?.data !== undefined ? res : { data: Array.isArray(res) ? res : [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  onboarding: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse p-md">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, loading }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (<>
    <div className="fixed inset-0 z-[60] bg-black/50" onClick={onCancel} />
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-md">
      <div className="bg-surface rounded-card border border-border shadow-xl p-lg max-w-sm w-full space-y-md">
        <div className="flex items-center gap-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="text-h4 font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="text-body text-text-secondary">{message}</p>
        <div className="flex justify-end gap-sm">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-button border border-border bg-surface text-body font-medium hover:bg-background transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">{loading ? 'Processing...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  </>);
}

export default function SubscribersPage() {
  const t = useTranslations('subscribers');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; action: 'activate' | 'suspend' | 'deactivate' } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search input
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;

      const raw = await subscribersApi.list(params);
      const result = extract(raw);
      setSubscribers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const requestAction = (id: string, action: 'activate' | 'suspend' | 'deactivate') => {
    setConfirm({ id, action });
  };

  const executeAction = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await subscribersApi[confirm.action](confirm.id);
      setConfirm(null);
      await fetchData();
      setSelectedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const selected = subscribers.find((s) => s.id === selectedId);
  const displayName = (s: Subscriber) => s.business_name || s.owner_name || s.email;

  /* ── Error state ── */
  if (error) {
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
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {loading ? (
          <div className="bg-surface rounded-card border border-border overflow-hidden">
            <TableSkeleton />
          </div>
        ) : subscribers.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-surface rounded-card border border-border p-lg flex flex-col items-center justify-center gap-sm min-h-[30vh]">
            <Search className="w-10 h-10 text-text-secondary/40" />
            <p className="text-body text-text-secondary">{tc('noResults') ?? 'No subscribers found'}</p>
          </div>
        ) : (
          <>
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
                      <th className="text-left px-md py-sm font-medium text-text-secondary">{t('joined')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedId(sub.id)}
                        className="border-b border-border last:border-0 hover:bg-background cursor-pointer transition-colors"
                      >
                        <td className="px-md py-sm font-medium text-text-primary">{displayName(sub)}</td>
                        <td className="px-md py-sm text-text-secondary">{sub.phone}</td>
                        <td className="px-md py-sm">
                          <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[sub.status] ?? 'bg-gray-100 text-gray-600')}>
                            {tc(sub.status) ?? sub.status}
                          </span>
                        </td>
                        <td className="px-md py-sm text-text-secondary">{sub.plan?.name ?? '-'}</td>
                        <td className="px-md py-sm text-text-secondary">{new Date(sub.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-sm">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  className="bg-surface rounded-card border border-border p-md space-y-xs cursor-pointer active:bg-background transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary">{displayName(sub)}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', statusColors[sub.status] ?? 'bg-gray-100 text-gray-600')}>
                      {tc(sub.status) ?? sub.status}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary">{sub.phone}</p>
                  <div className="flex justify-between text-caption text-text-secondary">
                    <span>{sub.plan?.name ?? '-'}</span>
                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-caption text-text-secondary">
                  {tc('showing')} {(page - 1) * PAGE_SIZE + 1} {tc('to')}{' '}
                  {Math.min(page * PAGE_SIZE, total)} {tc('of')} {total} {tc('entries')}
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
          </>
        )}
      </div>

      {/* Detail side panel */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedId(null)} />
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
              {([
                [tc('name'), displayName(selected)],
                [t('phone'), selected.phone],
                [tc('email') ?? 'Email', selected.email],
                [t('plan'), selected.plan?.name ?? '-'],
                [t('joined'), new Date(selected.created_at).toLocaleDateString()],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}>
                  <p className="text-caption text-text-secondary">{label}</p>
                  <p className="text-body font-medium text-text-primary">{val}</p>
                </div>
              ))}
              <div>
                <p className="text-caption text-text-secondary">{tc('status')}</p>
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-caption font-medium', statusColors[selected.status] ?? 'bg-gray-100 text-gray-600')}>
                  {tc(selected.status) ?? selected.status}
                </span>
              </div>
            </div>
            <div className="p-md border-t border-border flex gap-sm">
              {selected.status !== 'active' && (
                <button disabled={actionLoading} onClick={() => requestAction(selected.id, 'activate')}
                  className="flex-1 py-2 rounded-button bg-green-600 text-white text-body font-medium hover:bg-green-700 transition-colors disabled:opacity-50">{tc('activate')}</button>
              )}
              {selected.status === 'active' && (
                <button disabled={actionLoading} onClick={() => requestAction(selected.id, 'suspend')}
                  className="flex-1 py-2 rounded-button bg-amber-500 text-white text-body font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">{tc('suspend')}</button>
              )}
              {selected.status !== 'cancelled' && selected.status !== 'inactive' && (
                <button disabled={actionLoading} onClick={() => requestAction(selected.id, 'deactivate')}
                  className="flex-1 py-2 rounded-button bg-red-600 text-white text-body font-medium hover:bg-red-700 transition-colors disabled:opacity-50">{tc('deactivate')}</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirm && (
        <ConfirmDialog
          title={tc(confirm.action) ?? confirm.action}
          message={t('confirmAction', { action: confirm.action }) ?? `Are you sure you want to ${confirm.action} this subscriber?`}
          onConfirm={executeAction}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}
    </>
  );
}
