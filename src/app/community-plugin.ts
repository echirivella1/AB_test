// Needed to register plugin web implementation, if it exists.
import 'capacitor-firebase';

// Other imports
import { Plugins } from '@capacitor/core';
import { FirebasePlugin } from 'capacitor-firebase';

interface CommunityPluginRegistry {
  Firebase: FirebasePlugin;
}

export const CommunityPlugins = Plugins as unknown as CommunityPluginRegistry;
