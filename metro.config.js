const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Expo Metro config
const config = getDefaultConfig(__dirname);

// Add your custom Metro configuration
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Apply NativeWind (Tailwind) transformation
module.exports = withNativeWind(config, { 
  input: './global.css',
  // Optional: You can add other NativeWind options here if needed
});