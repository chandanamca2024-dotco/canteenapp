
import { Buffer } from 'buffer';
global.Buffer = Buffer;
/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Enable error overlay
if (__DEV__) {
  console.log('=== DEV MODE: Debugging enabled ===');
}

// Global error handler
const originalErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('=== GLOBAL ERROR ===');
  console.error('Error:', error);
  console.error('Fatal:', isFatal);
  console.error('Stack:', error.stack);
  originalErrorHandler(error, isFatal);
});

AppRegistry.registerComponent(appName, () => App);
