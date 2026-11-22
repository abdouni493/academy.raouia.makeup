import { useMemo } from 'react';
import { CheckCircle2, Crown, Gem, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaggerGroup, StaggerItem } from '@/components/Motion';
import { Badge, Button, CardGridSkeleton, EmptyState } from '@/components/ui';
import { CoverImage } from '@/components/CoverImage';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { localeFor } from '@/i18n';
import { formatPrice, whatsappLink } from '@/lib/utils';
import { FormationCard } from './FormationCard';
import { useCatalog, usePublishedPacks } from './queries';

export function CatalogPage() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const catalog = useCatalog();
  const packs = usePublishedPacks();
  const email = profile?.email ?? '';

  const byId = useMemo(() => Object.fromEntries((catalog.data ?? []).map((c) => [c.id, c])), [catalog.data]);
  const loading = catalog.isLoading || packs.isLoading;
  const empty = !loading && !(catalog.data?.length || packs.data?.length);

  return (
    <div>
      <PageHeader eyebrow={<><Gem className="me-1 inline h-3.5 w-3.5" /> {t('nav.catalog')}</>} title={t('catalog.title')} subtitle={t('catalog.subtitle')} />

      {loading && <CardGridSkeleton />}
      {empty && <EmptyState icon={<Crown />} title={t('catalog.empty')} />}

      {!!packs.data?.length && (
        <section className="mb-12">
          <h2 className="mb-6 flex items-center gap-2 text-title-2">
            <Crown className="h-6 w-6 text-rosegold" /> {t('catalog.packs')}
          </h2>
          <StaggerGroup className="grid gap-6 lg:grid-cols-2">
            {packs.data.map((p) => (
              <StaggerItem key={p.id} className="h-full">
              <article className="card group flex h-full flex-col overflow-hidden transition-shadow duration-150 hover:shadow-elevated sm:flex-row">
                <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:w-2/5">
                  <CoverImage src={p.cover_url} alt={p.title} seed={p.id} pack />
                  <span className="absolute start-3 top-3">
                    <Badge tone="plum" icon={<Crown className="h-3 w-3" />}>
                      Pack
                    </Badge>
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-title-3">{p.title}</h3>
                    {p.price !== null && (
                      <span className="whitespace-nowrap text-headline tabular-nums text-label">
                        {formatPrice(p.price, p.currency, localeFor(i18n.language))}
                      </span>
                    )}
                  </div>
                  {p.description && <p className="mt-2 line-clamp-3 text-sm text-label-secondary">{p.description}</p>}
                  <div className="mt-4 text-footnote font-semibold text-label-secondary">
                    {t('catalog.includes', { count: p.formation_ids.length })}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {p.formation_ids.map((fid) =>
                      byId[fid] ? (
                        <li key={fid} className="flex items-center gap-2 text-sm text-label">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                          <span className="truncate">{byId[fid].title}</span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                  <div className="mt-auto pt-6">
                    {p.owned ? (
                      <Badge tone="green" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                        {t('catalog.owned')}
                      </Badge>
                    ) : (
                      <a href={whatsappLink(t('catalog.waPack', { name: p.title, email }))} target="_blank" rel="noreferrer">
                        <Button icon={<MessageCircle className="h-4 w-4" />}>{t('catalog.requestAccess')}</Button>
                      </a>
                    )}
                  </div>
                </div>
              </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}

      {!!catalog.data?.length && (
        <section>
          <h2 className="mb-6 text-title-2">{t('catalog.formations')}</h2>
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.data.map((f) => (
              <StaggerItem key={f.id}>
                <FormationCard entry={f} requestMessage={t('catalog.waFormation', { name: f.title, email })} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      )}
    </div>
  );
}
