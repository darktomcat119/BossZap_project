'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logsApi } from '@/lib/api';
import type { AuditLog, PaginatedResponse } from '@/lib/types';

const extract = (res: any) => res?.data ?? res;
const PAGE_SIZE = 20;

const actionColors: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  export: 'bg-amber-100 text-amber-700',
  subscriber_activated: 'bg-green-100 text-green-700',
  subscriber_suspended: 'bg-amber-100 text-amber-700',
  subscriber_deactivated: 'bg-red-100 text-red-700',
};

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-md">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function LogsPage() {
  const t = useTranslations('logs');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_SIZE),
      };
      if (actionFilter !== 'all') params.action = actionFilter;

      const raw = await logsApi.list(params);
      const result = extract(raw) as PaginatedResponse<AuditLog>;
      // Handle both paginated wrapper and direct array
      const items = Array.isArray(result) ? result as unknown as AuditLog[] : result.data;
      const totalCount = Array.isArray(result) ? (result as unknown as AuditLog[]).length : result.total;
      const pages = Array.isArray(result) ? 1 : result.totalPages;
      setLogs(items);
      setTotal(totalCount);
      setTotalPages(pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSubscriberName = (log: AuditLog) => {
    if (log.subscriber?.business_name) return log.subscriber.business_name;
    if (log.subscriber?.owner_name) return log.subscriber.owner_name;
    return log.subscriber_id ?? '-';
  };

  // Client-side search filtering (the API filters by action/date, text search is local)
  const filtered = search
    ? logs.filter((log) => {
        const name = getSubscriberName(log).toLowerCase();
        const entity = (log.entity_type ?? '').toLowerCase();
        return name.includes(search.toLowerCase()) || entity.includes(search.toLowerCase());
      })
    : logs;

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
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">{t('filterByAction')}</option>
          <option value="created">{t('created')}</option>
          <option value="updated">{t('updated')}</option>
          <option value="deleted">{t('deleted')}</option>
          <option value="login">{t('login')}</option>
          <option value="export">{t('export')}</option>
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
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left px-md py-sm font-medium text-text-secondary w-8"></th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('timestamp')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('subscriber')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('action')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('entity')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="border-b border-border hover:bg-background cursor-pointer transition-colors"
                    >
                      <td className="px-md py-sm">
                        {expandedId === log.id ? (
                          <ChevronUp className="w-4 h-4 text-text-secondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-secondary" />
                        )}
                      </td>
                      <td className="px-md py-sm text-text-secondary text-caption">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-md py-sm text-text-primary">{getSubscriberName(log)}</td>
                      <td className="px-md py-sm">
                        <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', actionColors[log.action] ?? 'bg-gray-100 text-gray-600')}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-md py-sm text-text-secondary">{log.entity_type}</td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-details`} className="border-b border-border bg-background">
                        <td colSpan={5} className="px-md py-sm">
                          <pre className="text-caption text-text-secondary bg-surface p-sm rounded-button overflow-x-auto">
                            {JSON.stringify(log.details ?? {}, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-sm">
            {filtered.map((log) => (
              <div
                key={log.id}
                className="bg-surface rounded-card border border-border overflow-hidden"
              >
                <div
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="p-md space-y-xs cursor-pointer active:bg-background transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', actionColors[log.action] ?? 'bg-gray-100 text-gray-600')}>
                      {log.action}
                    </span>
                    <span className="text-caption text-text-secondary">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-body text-text-primary font-medium">{getSubscriberName(log)}</p>
                  <p className="text-caption text-text-secondary">{log.entity_type}</p>
                </div>
                {expandedId === log.id && (
                  <div className="px-md pb-md">
                    <pre className="text-caption text-text-secondary bg-background p-sm rounded-button overflow-x-auto">
                      {JSON.stringify(log.details ?? {}, null, 2)}
                    </pre>
                  </div>
                )}
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
  );
}
