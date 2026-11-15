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
    <div className="card fixed bottom-4 end-4 z-40 w-[min(380px,calc(100vw-2rem))] overflow-hidden">
      <button onClick={() => setCollapsed((c) => !c)} className="flex w-full items-center justify-between gap-2 bg-plum px-4 py-3 text-sm text-white">
        <span className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-blush-300" />
          {t('videos.uploadsInProgress')} ({active})
        </span>
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {!collapsed && (
        <div className="scrollbar-thin max-h-80 space-y-2 overflow-y-auto p-3">
          {items.map((i) => (
            <UploadRow key={i.id} item={i} />
          ))}
          {items.length > active && (
            <button onClick={clearFinished} className="w-full pt-1 text-center text-xs text-muted hover:text-plum">
              {t('common.close')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
