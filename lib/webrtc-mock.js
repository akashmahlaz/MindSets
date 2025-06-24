// Mock implementation for @stream-io/react-native-webrtc
// This is used during server-side rendering where native components are not available

export const RTCView = () => null;
export const MediaStream = () => null;
export const RTCPeerConnection = () => null;
export const getUserMedia = () => Promise.resolve(null);

// Mock all required exports to prevent runtime errors
module.exports = {
  RTCView: () => null,
  MediaStream: () => null,
  RTCPeerConnection: () => null,
  getUserMedia: () => Promise.resolve(null),
  default: {
    RTCView: () => null,
    MediaStream: () => null,
    RTCPeerConnection: () => null,
    getUserMedia: () => Promise.resolve(null),
  }
};
