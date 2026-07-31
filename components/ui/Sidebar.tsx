'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Lightbulb,
  PlayCircle,
  AlertTriangle,
  BookOpen,
  Folder,
  ArrowRightLeft,
  Car,
  Wrench,
  Search as SearchIcon,
  BarChart3,
  UserCog,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface NavGroup {
  label: string;
  items: NavItemConfig[];
}

interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Received Goods', href: '/operations/goods', icon: <Package size={20} /> },
      { label: 'Documents', href: '/operations/documents', icon: <BookOpen size={20} /> },
      { label: 'Filing', href: '/operations/filing', icon: <Folder size={20} /> },
      { label: 'Visitors', href: '/operations/visitors', icon: <Users size={20} /> },
      { label: 'Tips', href: '/operations/tips', icon: <Lightbulb size={20} /> },
      { label: 'Playback Upload', href: '/operations/playback', icon: <PlayCircle size={20} /> },
      { label: 'Incident Log', href: '/operations/incidents', icon: <AlertTriangle size={20} /> },
      { label: 'Occurrence Book', href: '/operations/occurrence-book', icon: <BookOpen size={20} /> },
      { label: 'Shift Handover', href: '/operations/shift-handover', icon: <ArrowRightLeft size={20} /> },
    ],
  },
  {
    label: 'Registers',
    items: [
      { label: 'Vehicles', href: '/registers/vehicles', icon: <Car size={20} /> },
      { label: 'Equipment', href: '/registers/equipment', icon: <Wrench size={20} /> },
      { label: 'Lost & Found', href: '/registers/lost-found', icon: <SearchIcon size={20} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Activity Logs', href: '/activity-logs', icon: <BookOpen size={20} /> },
      { label: 'Reports', href: '/reports', icon: <BarChart3 size={20} /> },
      { label: 'Users', href: '/users', icon: <UserCog size={20} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Operations: true,
    Registers: true,
    Administration: true,
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Shield size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--color-text-heading)',
              lineHeight: 1.2,
            }}
          >
            Aqua Safari
          </div>
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Security Control
          </div>
        </div>
        {onClose && (
          <button
            className="btn btn-ghost btn-icon mobile-menu-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, groupIdx) => {
          // Hide Administration group from non-admins
          if (group.label === 'Administration' && user?.role !== 'admin' && user?.role !== 'superadmin') {
            return null;
          }

          return (
            <div key={groupIdx} className="sidebar-section">
              {group.label && (
                <button
                  className="sidebar-section-label"
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.75rem 0.75rem 0.375rem',
                  }}
                >
                  {group.label}
                  {expandedGroups[group.label] ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              )}
              {(!group.label || expandedGroups[group.label]) &&
                group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          ASR Control Room v1.0
        </div>
      </div>
    </aside>
  );
}
