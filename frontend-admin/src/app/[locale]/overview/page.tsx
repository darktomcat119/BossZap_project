'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';

export default function OverviewPage() {
  const t = useTranslations('overview');

  const cards = [
    {
      label: t('totalSubscribers'),
      value: '—',
      icon: Users,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: t('activeSubscribers'),
      value: '—',
      icon: UserCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: t('monthlyRevenue'),
      value: '—',
      icon: DollarSign,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: t('systemUptime'),
      value: '—',
      icon: Clock,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <AdminShell>
      <div className="p-md lg:p-xl">
        <h1 className="text-h1 font-bold text-text-primary mb-lg">
          {t('title')}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="card-interactive flex items-center gap-md"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-card ${card.bg}`}
                >
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-small text-text-secondary truncate">
                    {card.label}
                  </p>
                  <p className="text-h3 font-semibold text-text-primary">
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
