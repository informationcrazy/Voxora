import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voxora.app',
  appName: 'Voxora',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;