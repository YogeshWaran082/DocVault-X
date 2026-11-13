import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SecurityBanner } from './components/SecurityBanner';
import { DocumentList } from './components/DocumentList';
import { UploadModal } from './components/UploadModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { DvxViewerModal } from './components/DvxViewerModal';
import { AuditLogView } from './components/AuditLogView';
import { AuthScreen } from './components/AuthScreen';
import { ReceiverViewer } from './components/ReceiverViewer';
import { ApiClient } from './api/client';
import { User, Organization, Document, Policy } from './types';
import { Shield, BookOpen, Terminal } from 'lucide-react';

export function App() {
  const [shareToken, setShareToken] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/share/')) {
      return hash.replace('#/share/', '');
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('share');
  });

  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'audit' | 'docs'>('documents');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDvxModalOpen, setIsDvxModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewPolicy, setPreviewPolicy] = useState<Policy | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen to hash changes (e.g. clicking share links or dvx)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        setShareToken(hash.replace('#/share/', ''));
      } else if (hash === '#/dvx') {
        setIsDvxModalOpen(true);
        setShareToken(null);
      } else {
        setShareToken(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toggle theme
  useEffect(() => {
    if (darkMode) {
      window.document.documentElement.classList.add('dark');
    } else {
      window.document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load session
  const loadSession = async () => {
    try {
      if (!ApiClient.getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await ApiClient.getMe();
      setUser(data.user);
      setOrganization(data.currentOrganization);
      await loadDocuments();
    } catch {
      ApiClient.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await ApiClient.listDocuments();
      setDocuments(data.documents);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleOpenPreview = async (doc: Document) => {
    try {
      const detail = await ApiClient.getDocument(doc.id);
      setPreviewDoc(detail.document);
      setPreviewPolicy(detail.activePolicy);
    } catch {
      setPreviewDoc(doc);
      setPreviewPolicy(null);
    }
  };

  const handleLogout = () => {
    ApiClient.setToken(null);
    setUser(null);
    setOrganization(null);
    setDocuments([]);
  };

  if (shareToken) {
    return <ReceiverViewer token={shareToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Initializing DocVault X Cryptographic Engine...</p>
        </div>
      </div>
    );
  }

  if (!user || !organization) {
    return <AuthScreen onAuthenticated={loadSession} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar
        user={user}
        organization={organization}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDvx={() => setIsDvxModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Persistent Security Disclosure Banner */}
      <SecurityBanner />

      {/* Main Content Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'documents'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Vault Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Security Audit Trail</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'docs'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Architecture & Specs</span>
          </button>
        </div>

        {/* Tab 1: Documents */}
        {activeTab === 'documents' && (
          <DocumentList
            documents={documents}
            user={user}
            onRefresh={loadDocuments}
            onPreview={handleOpenPreview}
          />
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'audit' && <AuditLogView />}

        {/* Tab 3: Architecture & Invariants Documentation */}
        {activeTab === 'docs' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                DocVault X System Specification
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Production-grade multi-platform SaaS platform for uploading any binary document, encrypting it into a .dvx container, assigning signed access policies, distributing protected files, and viewing supported formats offline through controlled clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Cryptographic Standard</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 font-mono text-[11px]">
                  <li>Cipher: AES-256-GCM (64 KB chunk authenticated AEAD)</li>
                  <li>Signatures: Ed25519 for policies & device licenses</li>
                  <li>Envelope: Random 256-bit DEK per version, KMS-wrapped</li>
                  <li>Container Magic: DVX1 with canonical CBOR metadata</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Supported Target Clients</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-500">
                  <li>Web Dashboard & Admin Hub (Next.js / Vite React)</li>
                  <li>Desktop Secure Viewer (Tauri 2 + Rust)</li>
                  <li>Mobile Secure Viewer (Flutter + Native Keystore)</li>
                  <li>Offline Web PWA (IndexedDB + Web Crypto API)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Wizard Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadDocuments}
      />

      {/* Mode B: DVX Browser Viewer Modal */}
      <DvxViewerModal
        isOpen={isDvxModalOpen}
        onClose={() => {
          setIsDvxModalOpen(false);
          if (window.location.hash === '#/dvx') {
            window.location.hash = '';
          }
        }}
      />

      {/* Secure Document Viewer Modal */}
      <DocumentViewerModal
        document={previewDoc}
        policy={previewPolicy}
        user={user}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
