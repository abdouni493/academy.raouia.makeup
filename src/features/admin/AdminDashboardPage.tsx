import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Crown, Sparkles, UserCheck, Users, Video, Gem } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaggerGroup, StaggerItem } from '@/components/Motion';
import { Badge, Card, CardHeader, Skeleton } from '@/components/ui';
import { StatusBadge } from '@/components/Badges';
import { PageHeader } from '@/components/PageHeader';
import { localeFor } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Video as VideoRow } from '@/types/database';
import { useVideosRealtime } from './hooks';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = localeFor(i18n.language);
  useVideosRealtime();

  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_dashboard_stats').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const recent = useQuery({
    queryKey: ['admin', 'clients', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }).limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
  const attention = useQuery({
    queryKey: ['admin', 'attention'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*, formations(title)')
        .in('status', ['uploading', 'processing', 'failed'])
        .order('updated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as (VideoRow & { formations: { title: string } | null })[];
    },
  });

  const cards = [
    { label: t('admin.statClients'), value: stats.data?.clients_count, icon: Users },
    { label: t('admin.statActive'), value: stats.data?.active_clients_count, icon: UserCheck },
    { label: t('admin.statFormations'), value: stats.data?.formations_count, icon: Gem },
    { label: t('admin.statVideos'), value: stats.data?.videos_count, icon: Video },
    { label: t('admin.statPacks'), value: stats.data?.packs_count, icon: Crown },
    { label: t('admin.statMinutes'), value: stats.data?.total_video_minutes, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={<><Sparkles className="me-1 inline h-3.5 w-3.5" /> Admin</>} title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />

      <StaggerGroup className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c, i) => (
          <StaggerItem key={c.label}>
          <div className="card group relative h-full overflow-hidden p-5 transition-shadow hover:shadow-glow">
            <div className="absolute -end-6 -top-6 h-20 w-20 rounded-full bg-blush-100 transition group-hover:scale-125" />
            <span className={`relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${i % 2 ? 'bg-champagne text-rosegold' : 'bg-brand-gradient text-white'}`}>
              <c.icon className="h-5 w-5" />
            </span>
            {stats.isLoading ? <Skeleton className="h-8 w-16" /> : <div className="relative font-display text-3xl font-semibold text-plum">{c.value ?? 0}</div>}
            <div className="relative mt-1 text-xs text-muted">{c.label}</div>
          </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<Users className="h-5 w-5" />} title={t('admin.recentClients')} action={<Link to="/admin/clients" className="text-sm text-rosegold hover:text-blush-600">→</Link>} />
          <div className="divide-y divide-blush-100">
            {recent.isLoading && <Skeleton className="m-5 h-24" />}
            {recent.data?.length === 0 && <p className="p-6 text-center text-sm text-muted">{t('clients.empty')}</p>}
            {recent.data?.map((c) => (
              <Link key={c.id} to={`/admin/clients/${c.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-blush-50/60">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-100 text-sm font-semibold text-blush-700">
                  {(c.full_name || c.email || '?').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-plum">{c.full_name || '—'}</div>
                  <div className="truncate text-xs text-muted">{c.email}</div>
                </div>
                <span className="text-xs text-muted">{formatDate(c.created_at, locale)}</span>
                {!c.is_active && <Badge tone="red">{t('clients.suspended')}</Badge>}
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Video className="h-5 w-5" />} title={t('admin.videosAttention')} />
          <div className="divide-y divide-blush-100">
            {attention.isLoading && <Skeleton className="m-5 h-24" />}
            {attention.data?.length === 0 && (
              <p className="flex items-center justify-center gap-2 p-6 text-center text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('admin.noAttention')}
              </p>
            )}
            {attention.data?.map((v) => (
              <Link key={v.id} to={`/admin/formations/${v.formation_id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-blush-50/60">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-plum">{v.title}</div>
                  <div className="truncate text-xs text-muted">{v.formations?.title}</div>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
