import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface IncomingCall {
  callId: string;
  callerName: string;
  callerImage?: string;
  isVideoCall: boolean;
  timestamp: number;
}

export interface OngoingCall {
  callId: string;
  contactName: string;
  startTime: number;
  isVideoCall: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
}

// Configure notification handler - IMPORTANT: Don't block notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log(
      "Notification handler called:",
      notification.request.content.data?.type,
    );

    return {
      shouldShowAlert: true, // Always show
      shouldPlaySound: false,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export class CallNotificationService {
  private static ongoingCallNotificationId: string | null = null;
  private static outgoingCallNotificationId: string | null = null;
  private static callTimerInterval: NodeJS.Timeout | null = null;

  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("Notification permission status:", finalStatus);

    if (Platform.OS === "android") {
      // Create notification channels
      await Notifications.setNotificationChannelAsync("incoming_calls", {
        name: "Incoming Calls",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      await Notifications.setNotificationChannelAsync("ongoing_calls", {
        name: "Ongoing Calls",
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [0],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
      });

      await Notifications.setNotificationChannelAsync("outgoing_calls", {
        name: "Outgoing Calls",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
        vibrationPattern: [0],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
      });

      console.log("Android notification channels created");
    }

    return finalStatus === "granted";
  }

  // Show incoming call notification
  static async showIncomingCallNotification(
    call: IncomingCall,
  ): Promise<string> {
    const hasPermission = await this.requestPermissions();

    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return "";
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: call.callerName,
        body: `Incoming ${call.isVideoCall ? "video" : "voice"} call`,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        autoDismiss: false,
        categoryIdentifier: "INCOMING_CALL",
        data: {
          callId: call.callId,
          callerName: call.callerName,
          isVideoCall: call.isVideoCall,
          type: "incoming_call",
          timestamp: call.timestamp,
        },
        ...(Platform.OS === "android" && {
          color: "#00C6A7",
          channelId: "incoming_calls",
        }),
      },
      trigger: null,
    });

    console.log("Incoming call notification created:", notificationId);
    return notificationId;
  }

  // Show outgoing call notification
  static async showOutgoingCallNotification(
    contactName: string,
    isVideoCall: boolean,
  ): Promise<string> {
    const hasPermission = await this.requestPermissions();

    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return "";
    }

    // Cancel any existing outgoing notification
    if (this.outgoingCallNotificationId) {
      await this.dismissNotification(this.outgoingCallNotificationId);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Calling ${contactName}...`,
        body: "Connecting",
        sound: undefined,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        sticky: false,
        autoDismiss: false,
        categoryIdentifier: "OUTGOING_CALL",
        data: {
          contactName,
          isVideoCall,
          type: "outgoing_call",
        },
        ...(Platform.OS === "android" && {
          color: "#00C6A7",
          channelId: "outgoing_calls",
        }),
      },
      trigger: null,
    });

    this.outgoingCallNotificationId = notificationId;
    console.log("Outgoing call notification created:", notificationId);
    return notificationId;
  }

  // Show ongoing call notification
  static async showOngoingCallNotification(call: OngoingCall): Promise<void> {
    const hasPermission = await this.requestPermissions();

    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return;
    }

    console.log("=== CREATING ONGOING CALL NOTIFICATION ===");
    console.log("Contact:", call.contactName);
    console.log("Is Video:", call.isVideoCall);

    // First dismiss outgoing
    await this.cancelOutgoingCallNotification();

    // Stop any existing timer
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    // Create ongoing notification
    await this.createOrUpdateOngoingNotification(call);

    // Start timer to update duration
    this.callTimerInterval = setInterval(async () => {
      await this.createOrUpdateOngoingNotification(call);
    }, 1000);
  }

  // Create or update ongoing notification
  private static async createOrUpdateOngoingNotification(
    call: OngoingCall,
  ): Promise<void> {
    try {
      const duration = this.formatCallDuration(Date.now() - call.startTime);

      // Dismiss old notification if exists
      if (this.ongoingCallNotificationId) {
        await Notifications.dismissNotificationAsync(
          this.ongoingCallNotificationId,
        );
      }

      // Create new notification
      this.ongoingCallNotificationId =
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${call.isVideoCall ? "📹 Video" : "📞 Voice"} Call - ${call.contactName}`,
            body: `Call duration: ${duration}\nTap to return to call`,
            sound: undefined,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            sticky: true,
            autoDismiss: false,
            categoryIdentifier: "ONGOING_CALL",
            data: {
              callId: call.callId,
              contactName: call.contactName,
              isVideoCall: call.isVideoCall,
              type: "ongoing_call",
              startTime: call.startTime,
            },
            ...(Platform.OS === "android" && {
              color: "#00C6A7",
              channelId: "ongoing_calls",
              ongoing: true,
            }),
          },
          trigger: null,
        });

      console.log("Ongoing notification ID:", this.ongoingCallNotificationId);
    } catch (error) {
      console.error("Error creating ongoing notification:", error);
    }
  }

  // Cancel outgoing call notification
  static async cancelOutgoingCallNotification(): Promise<void> {
    console.log("Canceling outgoing notification...");

    if (this.outgoingCallNotificationId) {
      await this.dismissNotification(this.outgoingCallNotificationId);
      this.outgoingCallNotificationId = null;
    }

    // Also dismiss any presented notifications with type outgoing_call
    const allNotifications =
      await Notifications.getPresentedNotificationsAsync();
    console.log("All presented notifications:", allNotifications.length);

    for (const notification of allNotifications) {
      if (notification.request.content.data?.type === "outgoing_call") {
        console.log(
          "Dismissing outgoing notification:",
          notification.request.identifier,
        );
        await Notifications.dismissNotificationAsync(
          notification.request.identifier,
        );
      }
    }
  }

  // Helper to dismiss notification
  private static async dismissNotification(
    notificationId: string,
  ): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      console.log("Dismissed notification:", notificationId);
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  }

  // Cancel ongoing call notification
  static async cancelOngoingCallNotification(): Promise<void> {
    console.log("Canceling ongoing call notification...");

    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    if (this.ongoingCallNotificationId) {
      await this.dismissNotification(this.ongoingCallNotificationId);
      this.ongoingCallNotificationId = null;
    }

    // Also cancel outgoing
    await this.cancelOutgoingCallNotification();

    console.log("All call notifications cancelled");
  }

  // Format call duration
  private static formatCallDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Set up notification categories
  static async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync("INCOMING_CALL", [
      {
        identifier: "ACCEPT_CALL",
        buttonTitle: "Accept",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "DECLINE_CALL",
        buttonTitle: "Decline",
        options: {
          opensAppToForeground: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("ONGOING_CALL", [
      {
        identifier: "RETURN_TO_CALL",
        buttonTitle: "Return",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "END_CALL",
        buttonTitle: "End Call",
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync("OUTGOING_CALL", [
      {
        identifier: "CANCEL_CALL",
        buttonTitle: "Cancel",
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);

    console.log("Notification categories set up");
  }

  // Listen for notification responses
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notification received
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void,
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Debug: Get all presented notifications
  static async debugPresentedNotifications(): Promise<void> {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    console.log("=== PRESENTED NOTIFICATIONS ===");
    notifications.forEach((notification) => {
      console.log("ID:", notification.request.identifier);
      console.log("Type:", notification.request.content.data?.type);
      console.log("Title:", notification.request.content.title);
      console.log("Body:", notification.request.content.body);
      console.log("---");
    });
  }
}
