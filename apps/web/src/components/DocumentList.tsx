import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  Search,
  Lock,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Document, User } from '../types';
import { ApiClient } from '../api/client';
import { ShareModal } from './ShareModal';

interface DocumentListProps {
  documents: Document[];
  user: User;
  onRefresh: () => void;
  onPreview: (doc: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  user: _user,
  onRefresh,
  onPreview
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [exportWarningDoc, setExportWarningDoc] = useState<Document | null>(null);
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSizeMb = (documents.reduce((acc, d) => acc + d.sizeBytes, 0) / (1024 * 1024)).toFixed(1);
  const activeCount = documents.filter((d) => d.status === 'active').length;
  const revokedCount = documents.filter((d) => d.status === 'revoked').length;

  const handleRevoke = async (docId: string) => {
    if (!window.confirm('Are you sure you want to revoke access to this document? All active leases will be invalidated upon reconnect.')) return;
    setActionLoading(docId);
    try {
      await ApiClient.revokeDocument(docId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Securely delete this document and zeroize encrypted storage? This cannot be undone.')) return;
    setActionLoading(docId);
    try {
      await ApiClient.deleteDocument(docId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadProtected = async (doc: Document) => {
    try {
      await ApiClient.downloadProtected(doc.id, doc.title);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleDownloadStandardDirect = async (doc: Document) => {
    try {
      let filename = doc.title;
      if (doc.mimeDetected.includes('pdf') && !filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
      }
      try {
        await ApiClient.exportUnprotected(doc.id, filename);
      } catch (e: any) {
        // If export wasn't previously enabled, enable it for document owner/sender and retry
        if (e.message && e.message.includes('allow unprotected export')) {
          await ApiClient.updatePolicy(doc.id, { allowExport: true });
          await ApiClient.exportUnprotected(doc.id, filename);
        } else {
          throw e;
        }
      }
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const confirmUnprotectedExport = async () => {
    if (!exportWarningDoc) return;
    try {
      let filename = exportWarningDoc.title;
      if (exportWarningDoc.mimeDetected.includes('pdf') && !filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
      }
      await ApiClient.exportUnprotected(exportWarningDoc.id, filename);
      setExportWarningDoc(null);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Vault Documents</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{documents.length}</span>
            <span className="text-xs text-slate-400">files</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Active Protected</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</span>
            <span className="text-xs text-emerald-600/70">under lease</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Revoked Documents</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{revokedCount}</span>
            <span className="text-xs text-red-600/70">blocked</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Encrypted Storage</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{totalSizeMb}</span>
            <span className="text-xs text-slate-400">MB in vault</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'active', 'revoked'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === filter
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents found</h4>
            <p className="text-xs text-slate-400">Upload your first confidential file to encrypt it into a .dvx container.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Container Hash & Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-sm">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      <span className="block">{doc.sha256Ciphertext.substring(0, 16)}...</span>
                      <span className="text-[10px] text-slate-400 uppercase">{doc.mimeDetected}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          doc.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        {doc.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3" />
                            <span>Revoked</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* 0. Share Link (Browser Viewing - No App Required) */}
                        {doc.status === 'active' && (
                          <button
                            onClick={() => setShareDoc(doc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                            title="Generate an expiring browser link for recipient (opens in Chrome/Safari with automatic expiry)"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share Link</span>
                          </button>
                        )}

                        {/* 1. Preview / Open in app */}
                        <button
                          onClick={() => onPreview(doc)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                          title="Open & view inside DocVault Secure Viewer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>

                        {/* 2. Download Standard PDF (Opens in Adobe, Chrome, Apple Preview) */}
                        {doc.status === 'active' && (
                          <button
                            onClick={() => handleDownloadStandardDirect(doc)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                            title="Download standard PDF (Warning: Regular PDFs opened in Adobe Acrobat cannot self-destruct once on desktop)"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Normal PDF</span>
                          </button>
                        )}

                        {/* 3. Download Protected .dvx */}
                        {doc.status === 'active' && (
                          <button
                            onClick={() => handleDownloadProtected(doc)}
                            title="Download self-destructing .dvx encrypted container (requires DocVault client app)"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 text-xs font-medium transition"
                          >
                            <Lock className="w-3 h-3 text-brand-400" />
                            <span>.dvx File</span>
                          </button>
                        )}

                        {/* 4. Revoke */}
                        {doc.status === 'active' && (
                          <button
                            onClick={() => handleRevoke(doc.id)}
                            disabled={actionLoading === doc.id}
                            title="Revoke Document Access"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 5. Delete */}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={actionLoading === doc.id}
                          title="Secure Delete"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mode A Unprotected Export Warning Modal */}
      {exportWarningDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Unprotected Export Confirmation
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Notice: You are exporting an unencrypted standard file for "{exportWarningDoc.title}".
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                <li>This file will open in standard applications (Adobe Acrobat, Chrome, MS Office).</li>
                <li><strong>All self-destruct, offline expiry, and remote revocation guarantees are permanently lost.</strong></li>
                <li>This action is permanently recorded in the tenant audit log.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setExportWarningDoc(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnprotectedExport}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 active:scale-95 transition"
              >
                I Understand, Export Unprotected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal for generating browser expiring links */}
      <ShareModal
        document={shareDoc}
        isOpen={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
      />
    </div>
  );
};
