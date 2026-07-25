import { registerPlugin } from '@capacitor/core';

export interface CallServicePlugin {
  startCallService(): Promise<{ started: boolean }>;
  stopCallService(): Promise<{ stopped: boolean }>;
}

const CallService = registerPlugin<CallServicePlugin>('CallService');

export default CallService;
