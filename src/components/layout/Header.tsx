import { Link, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { isAuthenticated, logout } from '@/services/auth-service';
import { navItems } from './index';

export function Header() {
  const location = useLocation();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <header className="border-b border-black/10 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-8 rounded-full bg-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight">Frontend Assessment</h1>
        </div>
        <p className="text-sm text-muted-foreground font-mono mb-6">
          React Query + TypeScript + Tailwind CSS
        </p>
        
        <nav className="flex flex-wrap gap-2 items-center">
          {navItems.map(({ path, label, color }) => {
            const isActive = location.pathname === path;
            const activeClasses: Record<string, string> = {
              blue: 'bg-blue-600 text-white shadow-md',
              purple: 'bg-purple-600 text-white shadow-md',
              green: 'bg-green-600 text-white shadow-md',
              indigo: 'bg-indigo-600 text-white shadow-md',
              orange: 'bg-orange-600 text-white shadow-md',
              red: 'bg-red-600 text-white shadow-md',
            };
            
            return (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 text-sm font-mono rounded-md transition-all ${
                  isActive
                    ? activeClasses[color]
                    : 'bg-white/80 text-gray-700 hover:bg-white border border-black/10'
                }`}
              >
                {label}
              </Link>
            );
          })}
          {authenticated && (
            <Button
              onClick={handleLogout}
              variant="outline"
              className="ml-auto font-mono text-sm border-black/10 hover:bg-black/5"
            >
              Logout
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
