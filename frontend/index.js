/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { enableScreens } from 'react-native-screens'; // Import enableScreens

enableScreens(); // Call enableScreens at the top level

AppRegistry.registerComponent(appName, () => App);
