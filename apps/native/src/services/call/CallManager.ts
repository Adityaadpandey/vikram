import {
  CallNotificationService,
  OngoingCall,
} from "./CallNotificationService";

interface ActiveCall {
  callId: string;
  contactName: string;
  isVideoCall: boolean;
  startTime: number;
  isActive: boolean;
}

class CallManagerClass {
  private activeCall: ActiveCall | null = null;
  private callTimer: NodeJS.Timeout | null = null;

  // Start a new call
  startCall(callId: string, contactName: string, isVideoCall: boolean): void {
    this.activeCall = {
      callId,
      contactName,
      isVideoCall,
      startTime: Date.now(),
      isActive: true,
    };
  }

  // Mark call as connected and start notification
  async callConnected(): Promise<void> {
    if (!this.activeCall) return;

    await CallNotificationService.showOngoingCallNotification({
      callId: this.activeCall.callId,
      contactName: this.activeCall.contactName,
      startTime: this.activeCall.startTime,
      isVideoCall: this.activeCall.isVideoCall,
      isMuted: false,
      isSpeakerOn: false,
    });
  }

  // End call and cleanup
  async endCall(): Promise<void> {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    await CallNotificationService.cancelOngoingCallNotification();
    this.activeCall = null;
  }

  // Get active call info
  getActiveCall(): ActiveCall | null {
    return this.activeCall;
  }

  // Check if call is active
  isCallActive(): boolean {
    return this.activeCall !== null && this.activeCall.isActive;
  }

  // Update call notification
  async updateCallNotification(
    isMuted: boolean,
    isSpeakerOn: boolean,
  ): Promise<void> {
    if (!this.activeCall) return;

    await CallNotificationService.showOngoingCallNotification({
      callId: this.activeCall.callId,
      contactName: this.activeCall.contactName,
      startTime: this.activeCall.startTime,
      isVideoCall: this.activeCall.isVideoCall,
      isMuted,
      isSpeakerOn,
    });
  }

  // Get call duration
  getCallDuration(): number {
    if (!this.activeCall) return 0;
    return Math.floor((Date.now() - this.activeCall.startTime) / 1000);
  }
}

export const CallManager = new CallManagerClass();
