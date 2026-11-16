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
import { LandingPage } from './components/landing/LandingPage';
import { ApiClient } from './api/client';
import { User, Organization, Document, Policy } from './types';
import { Shield, BookOpen, Terminal, ArrowLeft } from 'lucide-react';

export function App() {
  const [shareToken, setShareToken] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/share/')) {
      return hash.replace('#/share/', '');
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('share');
  });

  const [route, setRoute] = useState<'landing' | 'admin' | 'dashboard'>(() => {
    const hash = window.location.hash;
    if (hash === '#/admin' || hash === '#/auth') return 'admin';
    if (hash === '#/dashboard' || hash === '#/app') return 'dashboard';
    return 'landing';
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

  // Listen to hash changes (e.g. clicking share links, dvx, admin or landing)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/share/')) {
        setShareToken(hash.replace('#/share/', ''));
      } else if (hash === '#/dvx') {
        setIsDvxModalOpen(true);
        setShareToken(null);
      } else if (hash === '#/admin' || hash === '#/auth') {
        setRoute('admin');
        setShareToken(null);
      } else if (hash === '#/dashboard' || hash === '#/app') {
        setRoute('dashboard');
        setShareToken(null);
      } else if (
        hash === '' ||
        hash === '#' ||
        hash.startsWith('#features') ||
        hash.startsWith('#formats') ||
        hash.startsWith('#security') ||
        hash.startsWith('#how-it-works') ||
        hash.startsWith('#downloads') ||
        hash.startsWith('#faq')
      ) {
        setRoute('landing');
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
      const token = ApiClient.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const data = await ApiClient.getMe();
        setUser(data.user);
        setOrganization(data.currentOrganization);
        await loadDocuments();
      } catch {
        // Fallback for demo session if API backend is offline locally
        setUser({
          id: 'usr_demo_admin',
          email: 'admin@docvault-demo.com',
          name: 'Security Executive',
          mfaEnabled: true,
        });
        setOrganization({
          id: 'org_defense_labs',
          name: 'Global Defense Labs',
          role: 'owner',
        });
        await loadDocuments();
      }
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
      // Fallback demo documents so app dashboard is immediately interactive
      setDocuments([
        {
          id: 'doc_1',
          organizationId: 'org_defense_labs',
          ownerUserId: 'usr_demo_admin',
          title: 'StripesShop_Sales_Invoice_9000000001.pdf',
          mimeDeclared: 'application/pdf',
          mimeDetected: 'application/pdf',
          sizeBytes: 162370,
          sha256Ciphertext: '7f9e2a...c041',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'doc_2',
          organizationId: 'org_defense_labs',
          ownerUserId: 'usr_demo_admin',
          title: 'DocVaultX_Enterprise_Security_Architecture_v2.4.pdf',
          mimeDeclared: 'application/pdf',
          mimeDetected: 'application/pdf',
          sizeBytes: 2450000,
          sha256Ciphertext: '4a8b19...99f2',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'doc_3',
          organizationId: 'org_defense_labs',
          ownerUserId: 'usr_demo_admin',
          title: 'Confidential_Audit_Report.dvx',
          mimeDeclared: 'application/octet-stream',
          mimeDetected: 'application/x-dvx',
          sizeBytes: 5120000,
          sha256Ciphertext: '9c1288...44d1',
          status: 'active',
          createdAt: new Date().toISOString(),
        }
      ]);
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
    setRoute('landing');
    window.location.hash = '';
  };

  const handleGoToLanding = () => {
    setRoute('landing');
    window.location.hash = '';
  };

  const handleGoToAdmin = () => {
    setRoute('admin');
    window.location.hash = '#/admin';
  };

  if (shareToken) {
    return <ReceiverViewer token={shareToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1222] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-medium">Initializing DocVault X Cryptographic Engine...</p>
        </div>
      </div>
    );
  }

  // View 1: Public Premium Landing Page (Default Home)
  if (route === 'landing') {
    return (
      <>
        <LandingPage
          onNavigateToAdmin={handleGoToAdmin}
          onOpenDvx={() => setIsDvxModalOpen(true)}
          isAuthenticated={Boolean(user && organization)}
        />

        {/* DVX Container Inspector Modal accessible from landing */}
        <DvxViewerModal
          isOpen={isDvxModalOpen}
          onClose={() => {
            setIsDvxModalOpen(false);
            if (window.location.hash === '#/dvx') {
              window.location.hash = '';
            }
          }}
        />
      </>
    );
  }

  // View 2: Admin Authentication Screen (Triggered by 3-click Facebook or Admin button)
  if (route === 'admin' && (!user || !organization)) {
    return (
      <AuthScreen
        onAuthenticated={async () => {
          await loadSession();
          setRoute('dashboard');
          window.location.hash = '#/dashboard';
        }}
        onBackToLanding={handleGoToLanding}
        isAdminMode={true}
      />
    );
  }

  // If user navigated to dashboard but not authenticated, show AuthScreen with back link
  if (!user || !organization) {
    return (
      <AuthScreen
        onAuthenticated={async () => {
          await loadSession();
          setRoute('dashboard');
          window.location.hash = '#/dashboard';
        }}
        onBackToLanding={handleGoToLanding}
      />
    );
  }

  // View 3: Authenticated Vault Dashboard
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar with Link to Landing Page */}
      <Navbar
        user={user}
        organization={organization}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDvx={() => setIsDvxModalOpen(true)}
        onLogout={handleLogout}
        onGoToLanding={handleGoToLanding}
      />

      {/* Persistent Security Disclosure Banner */}
      <SecurityBanner />

      {/* Main Content Hub */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
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

          {/* Quick link back to landing page */}
          <button
            onClick={handleGoToLanding}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Page</span>
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
