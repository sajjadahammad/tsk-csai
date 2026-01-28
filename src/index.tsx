import { Suspense } from 'react';
import { useLocation, Outlet } from 'react-router';
import { Spinner } from './components/ui/Spinner';
import { Header, Footer } from './components/layout';

export function AppLayout() {
  const location = useLocation();

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <div className="grid-bg min-h-screen">
        <Header />
        
        <main className="container mx-auto px-6 py-12">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground font-mono">Loading component...</p>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
