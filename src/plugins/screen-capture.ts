import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface ScreenCaptureFrameEvent {
  frame: string;   // base64-encoded JPEG
  width: number;
  height: number;
}

export interface ScreenCapturePlugin {
  startCapture(): Promise<{ started: boolean; width: number; height: number }>;
  stopCapture(): Promise<{ stopped: boolean }>;
  addListener(
    eventName: 'frame',
    listenerFunc: (data: ScreenCaptureFrameEvent) => void,
  ): Promise<PluginListenerHandle>;
}

const ScreenCapture = registerPlugin<ScreenCapturePlugin>('ScreenCapture');

export default ScreenCapture;
