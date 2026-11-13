import React from 'react';
import { ShieldCheck, Moon, Sun, LogOut, Building, Plus, FileBox } from 'lucide-react';
import { User, Organization } from '../types';

interface NavbarProps {
  user: User;
  organization: Organization;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUpload: () => void;
  onOpenDvx: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  organization,
  darkMode,
  onToggleDarkMode,
  onOpenUpload,
  onOpenDvx,
  onLogout
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-sky-600 dark:from-white dark:via-sky-400 dark:to-brand-400 bg-clip-text text-transparent">
                DocVault X
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Phase 1 v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Offline Protected Document Platform</p>
          </div>
        </div>

        {/* Tenant & Actions */}
        <div className="flex items-center gap-3">
          {/* Active Organization */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300">
            <Building className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="font-medium">{organization.name}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {organization.role}
            </span>
          </div>

          {/* Open DVX File Button */}
          <button
            onClick={onOpenDvx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm shadow-xs transition active:scale-95"
            title="Open an encrypted .dvx container file from your disk"
          >
            <FileBox className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="hidden xs:inline">Open .dvx File</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
