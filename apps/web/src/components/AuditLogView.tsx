import React, { useEffect, useState } from 'react';
import { History, ShieldAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { ApiClient } from '../api/client';
import { AuditEvent } from '../types';

export const AuditLogView: React.FC = () => {
  const [tab, setTab] = useState<'events' | 'alerts'>('events');
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsData, alertsData] = await Promise.all([
        ApiClient.listAuditEvents().catch(() => ({ auditEvents: [] })),
        ApiClient.listSecurityAlerts().catch(() => ({ alerts: [] }))
      ]);
      setEvents(eventsData.auditEvents || []);
      setAlerts(alertsData.alerts || []);
    } catch {
      // Ignored for non-admin roles
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'events'
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Immutable Audit Trail ({events.length})</span>
            </button>

            <button
              onClick={() => setTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'alerts'
                  ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Security Alerts ({alerts.length})</span>
            </button>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Refresh logs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto max-h-96">
        {tab === 'events' ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target Type</th>
                <th className="py-2.5 px-4">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No audit records found
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 capitalize">{evt.targetType}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                      {evt.actorUserId || 'Anonymous Recipient'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Alert Type</th>
                <th className="py-2.5 px-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 flex-col items-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <span>No security alerts detected</span>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-red-50/20 dark:hover:bg-red-950/20">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.severity === 'high' || alert.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                      {alert.alertType}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                      {alert.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
