import { useState } from 'react';

export function useAppUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/version');
      const data = await response.json();
      
      // Compare versions and set state
      const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
      if (data.version && data.version !== currentVersion) {
        setUpdateVersion(data.version);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  return {
    updateAvailable,
    updateVersion,
    checkForUpdates,
  };
}