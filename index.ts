// Background tasks must be defined at the top level of the bundle, before the app
// renders, so the OS can run them when it wakes the app without any UI.
import './src/lib/tasks';
import 'expo-router/entry';
