import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { clearAuthToken } from '../api';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children, organizer, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isCheckInPage = location.pathname === '/organizer/check-in';
  const isLoginPage = location.pathname === '/organizer/login';

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAuthToken();
      navigate('/organizer/login');
    }
  };

  return (
    <div className="app-frame flex flex-col justify-between min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full px-6 py-3.5 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md sticky top-0 z-30 shadow-xs transition-colors duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {isLoginPage ? (
            <div className="w-full flex items-center justify-between py-1">
              <div className="w-9 sm:w-10" />
              <Link to="/" className="inline-flex items-center group transition">
                <Logo
                  className="h-9 w-auto"
                  showText
                  textClassName="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                />
              </Link>
              <ThemeToggle />
            </div>
          ) : isCheckInPage ? (
            <>
              <div className="flex items-center gap-3">
                <Link to="/" className="inline-flex items-center group transition">
                  <Logo
                    className="h-8 w-auto"
                    showText
                    textClassName="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                  />
                </Link>
                <span className="text-slate-300 dark:text-slate-700 font-light text-lg">/</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/80">
                  Organizer Check-in
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                {organizer && (
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {organizer.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {organizer.email}
                    </div>
                  </div>
                )}
                <div className="w-8 h-8 rounded-full bg-[#0055b3] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="inline-flex items-center group transition">
                <Logo
                  className="h-8 w-auto"
                  showText
                  textClassName="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                />
              </Link>
              <div className="flex items-center gap-3 text-xs font-medium">
                <ThemeToggle />
                <Link
                  to="/organizer/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:border-slate-600 transition shadow-xs"
                >
                  Organizer login
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      {!isLoginPage && (
        <footer className="w-full px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="EventPass" className="h-4 w-auto opacity-75 dark:opacity-90 dark:brightness-110" />
              <span>EventPass · Campus Events</span>
            </div>
            <div>
              {isCheckInPage ? (
                <span className="text-slate-400 dark:text-slate-500">Station Active</span>
              ) : (
                <Link
                  to="/organizer/login"
                  className="hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  Organizer login
                </Link>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
