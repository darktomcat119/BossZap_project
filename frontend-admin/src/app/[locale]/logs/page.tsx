'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditLog, AuditAction } from '@/lib/types';

const mockLogs: AuditLog[] = [
  { id: '1', timestamp: '2026-03-24T14:32:10Z', subscriber: 'Carlos Mendez', action: 'updated', entity: 'budget', details: { budgetId: 'b-42', field: 'amount', from: 5000, to: 7500 } },
  { id: '2', timestamp: '2026-03-24T13:18:45Z', subscriber: 'Ana Silva', action: 'created', entity: 'budget', details: { budgetId: 'b-99', name: 'Q2 Marketing', amount: 12000 } },
  { id: '3', timestamp: '2026-03-24T12:05:22Z', subscriber: 'admin@bosszap.com', action: 'login', entity: 'session', details: { ip: '192.168.1.42', userAgent: 'Chrome/122' } },
  { id: '4', timestamp: '2026-03-24T11:45:00Z', subscriber: 'Laura Hernández', action: 'deleted', entity: 'document', details: { docId: 'd-17', name: 'report-jan.pdf' } },
  { id: '5', timestamp: '2026-03-24T10:30:15Z', subscriber: 'Diego Ferreira', action: 'export', entity: 'report', details: { format: 'pdf', period: 'Q1 2026' } },
  { id: '6', timestamp: '2026-03-24T09:12:33Z', subscriber: 'María García', action: 'updated', entity: 'plan', details: { from: 'Basic', to: 'Pro' } },
  { id: '7', timestamp: '2026-03-23T22:45:10Z', subscriber: 'Roberto Lima', action: 'created', entity: 'message', details: { templateId: 't-5', recipients: 150 } },
  { id: '8', timestamp: '2026-03-23T20:15:00Z', subscriber: 'Fernando Oliveira', action: 'updated', entity: 'profile', details: { field: 'phone', from: '+55 11 0000', to: '+55 11 5555 6666' } },
  { id: '9', timestamp: '2026-03-23T18:30:22Z', subscriber: 'Valentina López', action: 'deleted', entity: 'budget', details: { budgetId: 'b-31', name: 'Old Campaign' } },
  { id: '10', timestamp: '2026-03-23T16:00:45Z', subscriber: 'Isabela Martínez', action: 'created', entity: 'template', details: { templateId: 't-12', name: 'Welcome Message', language: 'es' } },
  { id: '11', timestamp: '2026-03-23T14:20:10Z', subscriber: 'admin@bosszap.com', action: 'login', entity: 'session', details: { ip: '10.0.0.5', userAgent: 'Firefox/124' } },
  { id: '12', timestamp: '2026-03-23T12:10:30Z', subscriber: 'Pedro Santos', action: 'export', entity: 'subscribers', details: { format: 'csv', count: 214 } },
];

const actionColors: Record<AuditAction, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  export: 'bg-amber-100 text-amber-700',
};

export default function LogsPage() {
  const t = useTranslations('logs');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchSearch =
        !search ||
        log.subscriber.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [search, actionFilter]);

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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
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
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-md py-sm text-text-primary">{log.subscriber}</td>
                    <td className="px-md py-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', actionColors[log.action])}>
                        {t(log.action)}
                      </span>
                    </td>
                    <td className="px-md py-sm text-text-secondary">{log.entity}</td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-details`} className="border-b border-border bg-background">
                      <td colSpan={5} className="px-md py-sm">
                        <pre className="text-caption text-text-secondary bg-surface p-sm rounded-button overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
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
                  <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', actionColors[log.action])}>
                    {t(log.action)}
                  </span>
                  <span className="text-caption text-text-secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-body text-text-primary font-medium">{log.subscriber}</p>
                <p className="text-caption text-text-secondary">{log.entity}</p>
              </div>
              {expandedId === log.id && (
                <div className="px-md pb-md">
                  <pre className="text-caption text-text-secondary bg-background p-sm rounded-button overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
