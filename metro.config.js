// metro.config.js
const metro = require('metro');
const Server = metro.Server;

// Monkey‑patch getCodeFrame to catch invalid paths
const origGetCodeFrame = Server.prototype.getCodeFrame;
Server.prototype.getCodeFrame = function (filename, ...rest) {
  if (!filename || filename.startsWith('http') || filename.includes('<anonymous>')) {
    return '';
  }
  return origGetCodeFrame.call(this, filename, ...rest);
};

module.exports = {
  ...require('expo/metro-config'), // or your existing config
};
