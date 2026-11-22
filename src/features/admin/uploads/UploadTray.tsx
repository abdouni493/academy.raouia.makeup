import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UploadRow } from './UploadRow';
import { useUploads } from './UploadProvider';

/** Floating panel showing uploads while the admin navigates elsewhere. */
export function UploadTray() {
  const { t } = useTranslation();
  const { items, active, clearFinished } = useUploads();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const onEditor = /^\/admin\/formations\/[^/]+$/.test(location.pathname);
  if (!items.length || onEditor) return null;

  return (
    <div className="material-sheet fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] rounded-2xl shadow-elevated lg:bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 z-40 w-[min(380px,calc(100vw-2rem))] overflow-hidden">
      <button onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} className="focus-ring flex min-h-12 w-full items-center justify-between gap-2 px-4 py-3 text-subhead font-semibold text-label">
        <span className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-accent" />
          {t('videos.uploadsInProgress')} ({active})
        </span>
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {!collapsed && (
        <div className="scrollbar-thin max-h-[min(20rem,45dvh)] space-y-2 overflow-y-auto bg-card p-2">
          {items.map((i) => (
            <UploadRow key={i.id} item={i} />
          ))}
          {items.length > active && (
            <button onClick={clearFinished} className="focus-ring min-h-11 w-full rounded-lg text-center text-footnote text-accent hover:bg-accent-soft">
              {t('common.close')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
