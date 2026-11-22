import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MotionConfig } from 'framer-motion';
import './i18n';
import './assets/fonts/fonts.css';
import './index.css';
import { useThemeMode } from './lib/theme';
import App from './App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { UploadProvider } from '@/features/admin/uploads/UploadProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function AppearanceToaster() {
  const theme = useThemeMode();
  return <Toaster theme={theme} position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
        <AuthProvider>
          <UploadProvider>
            <App />
            <AppearanceToaster />
          </UploadProvider>
        </AuthProvider>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
