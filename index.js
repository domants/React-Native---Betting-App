import "react-native-gesture-handler/lib/commonjs/web.js";

// Add window polyfill for web
if (typeof window === "undefined") {
  global.window = {};
}
