export interface WatermarkOptions {
  recipientEmail: string;
  ipHash?: string;
  timestamp: string;
  opacity?: number;
}

export function formatWatermarkText(opts: WatermarkOptions): string {
  const parts = [opts.recipientEmail, opts.timestamp];
  if (opts.ipHash) {
    parts.push(`IP: ${opts.ipHash}`);
  }
  return `CONFIDENTIAL • ${parts.join(' • ')}`;
}

export function getModeBadgeInfo(mode: 'NORMAL_EXPORT' | 'SECURE_NATIVE' | 'OFFLINE_PWA') {
  switch (mode) {
    case 'NORMAL_EXPORT':
      return {
        label: 'Unprotected Export',
        color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
        warning: 'Standard file export. Expiry and revocation CANNOT be enforced once downloaded.'
      };
    case 'SECURE_NATIVE':
      return {
        label: 'Secure Native (.dvx)',
        color: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200',
        warning: 'Protected container. Expiry enforced by honest client; requires DocVault viewer.'
      };
    case 'OFFLINE_PWA':
      return {
        label: 'Offline PWA',
        color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200',
        warning: 'Browser sandbox storage. Subject to browser clearing and client environment limitations.'
      };
  }
}
