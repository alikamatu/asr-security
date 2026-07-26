'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Bell,
  Search,
  LogOut,
  User,
  ChevronDown,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
import { capitalize } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'var(--color-danger)';
      case 'supervisor': return 'var(--color-warning)';
      case 'manager': return 'var(--color-info)';
      default: return 'var(--color-success)';
    }
  };

  return (
    <header className="app-header">
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost btn-icon mobile-menu-btn"
          onClick={onToggleSidebar}
          id="sidebar-toggle"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="search-input-wrapper" style={{ maxWidth: 400 }}>
          <Search />
          <input
            type="text"
            className="form-input"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', background: 'var(--color-bg-tertiary)' }}
          />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        
        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notification Bell */}
        <button
          className="btn btn-ghost btn-icon"
          style={{ position: 'relative' }}
          title="Notifications"
        >
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        {/* User Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ gap: '0.625rem', padding: '0.375rem 0.75rem' }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--color-accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'white',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ textAlign: 'left' }} className="hidden sm:block">
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {user?.name || 'User'}
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: getRoleColor(user?.role || ''),
                  fontWeight: 500,
                }}
              >
                {capitalize(user?.role || '')}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
          </button>

          {showUserMenu && (
            <div className="dropdown" style={{ minWidth: 180 }}>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Signed in as <strong style={{ color: 'var(--color-text-primary)' }}>{user?.email}</strong>
              </div>
              <button className="dropdown-item" onClick={() => { setShowUserMenu(false); router.push('/settings'); }}>
                <User size={16} />
                Profile
              </button>
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{ color: 'var(--color-danger)' }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
