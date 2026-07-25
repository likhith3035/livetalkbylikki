import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface CallActionEvent {
  action: 'toggleMute' | 'toggleCamera' | 'endCall';
}

export interface CallServicePlugin {
  startCallService(options?: { strangerName?: string }): Promise<{ started: boolean }>;
  stopCallService(): Promise<{ stopped: boolean }>;
  addListener(
    eventName: 'callAction',
    listenerFunc: (data: CallActionEvent) => void,
  ): Promise<PluginListenerHandle>;
}

const CallService = registerPlugin<CallServicePlugin>('CallService');

export default CallService;
