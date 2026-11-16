import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.docvaultx.viewer',
  appName: 'DocVault X',
  webDir: 'apps/web/dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
