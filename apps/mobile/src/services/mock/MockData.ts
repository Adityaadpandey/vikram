export const MOCK_USERS = {
  personnel: {
    username: "officer001",
    password: "Secure@123",
    mfaCode: "123456",
    role: "Personnel",
  },
  veteran: {
    username: "veteran001",
    password: "Secure@123",
    mfaCode: "654321",
    role: "Veteran",
  },
  family: {
    username: "family001",
    password: "Secure@123",
    mfaCode: "111222",
    role: "Family",
  },
};

// Test users
export const TEST_USERS = {
  personnel: {
    armyId: "DEF2025001",
    phone: "+919876543210",
    name: "Captain Arjun Singh",
    rank: "Captain",
    unit: "5th Infantry Division",
    seedPhrase:
      "abandon amount liar amount expire adjust cage candy arch gather drum buyer hello world here",
  },
  veteran: {
    armyId: "VET2020045",
    phone: "+919876543211",
    name: "Major Rakesh Sharma",
    rank: "Major (Retd.)",
    unit: "Special Forces",
    seedPhrase:
      "board flee heavy tunnel powder denial science ski answer betray cargo cat hello world here",
  },
};

export const MOCK_OTP = "123456";

// Direct Chats
export const MOCK_DIRECT_CHATS = [
  {
    id: "d1",
    name: "Capt. Arjun Singh",
    members: 2,
    unread: 2,
    lastMessage: "See you at the briefing",
    timestamp: "11:45 AM",
  },
  {
    id: "d2",
    name: "Lt. Priya Nair",
    members: 2,
    unread: 0,
    lastMessage: "Roger that",
    timestamp: "Yesterday",
  },
  {
    id: "d3",
    name: "Sgt. Manoj Kumar",
    members: 2,
    unread: 1,
    lastMessage: "Equipment ready",
    timestamp: "2 days ago",
  },
];

// Group Chats
export const MOCK_GROUPS = [
  {
    id: "g1",
    name: "Alpha Squad",
    members: 12,
    unread: 3,
    lastMessage: "Mission briefing at 1400 hours",
    timestamp: "10:30 AM",
  },
  {
    id: "g2",
    name: "Veterans Support",
    members: 45,
    unread: 0,
    lastMessage: "Weekly meetup scheduled",
    timestamp: "Yesterday",
  },
  {
    id: "g3",
    name: "Family Network",
    members: 28,
    unread: 1,
    lastMessage: "Event this weekend",
    timestamp: "2 days ago",
  },
];

export const MOCK_PENDING_MEMBERS = [
  {
    id: "1",
    name: "Sgt. Manoj Kumar",
    rank: "Sergeant",
    unit: "5th Infantry",
    requestDate: "2 hours ago",
  },
  {
    id: "2",
    name: "Cpl. Anjali Verma",
    rank: "Corporal",
    unit: "3rd Battalion",
    requestDate: "1 day ago",
  },
];

export interface Contact {
  id: string;
  serviceId: string;
  name: string;
  rank?: string;
  unit?: string;
  relation?: string;
  relationType: "professional" | "family";
  phone: string;
  profileImage?: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}

export interface PendingRequest {
  id: string;
  serviceId: string;
  name: string;
  rank?: string;
  unit?: string;
  relation?: string;
  relationType: "professional" | "family";
  phone: string;
  requestDate: string;
  message?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isStarred?: boolean;
  mentions?: string[]; // Array of user IDs mentioned
  type: "text" | "image" | "video" | "audio" | "document";
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: "direct" | "group";
  lastMessage: string;
  timestamp: string;
  unread: number;
  profileImage?: string;
  members?: string[]; // Array of contact IDs
}

// Universal Contacts List
export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    serviceId: "DEF2025001",
    name: "Capt. Arjun Singh",
    rank: "Captain",
    unit: "5th Infantry Division",
    relationType: "professional",
    phone: "+91 98765 43210",
    status: "online",
  },
  {
    id: "c2",
    serviceId: "DEF2025002",
    name: "Lt. Priya Nair",
    rank: "Lieutenant",
    unit: "3rd Artillery Regiment",
    relationType: "professional",
    phone: "+91 98765 43211",
    status: "online",
  },
  {
    id: "c3",
    serviceId: "DEF2025003",
    name: "Maj. Rakesh Sharma",
    rank: "Major",
    unit: "2nd Armored Division",
    relationType: "professional",
    phone: "+91 98765 43212",
    status: "offline",
    lastSeen: "2 hours ago",
  },
  {
    id: "c4",
    serviceId: "DEF2025004",
    name: "Sgt. Manoj Kumar",
    rank: "Sergeant",
    unit: "7th Special Forces",
    relationType: "professional",
    phone: "+91 98765 43213",
    status: "online",
  },
  {
    id: "c5",
    serviceId: "DEF2025005",
    name: "Cpl. Anjali Verma",
    rank: "Corporal",
    unit: "4th Medical Corps",
    relationType: "professional",
    phone: "+91 98765 43214",
    status: "away",
  },
  {
    id: "c6",
    serviceId: "FAM001",
    name: "Rajesh Singh",
    relation: "Father",
    relationType: "family",
    phone: "+91 98765 43215",
    status: "online",
  },
  {
    id: "c7",
    serviceId: "FAM002",
    name: "Sunita Singh",
    relation: "Mother",
    relationType: "family",
    phone: "+91 98765 43216",
    status: "online",
  },
  {
    id: "c8",
    serviceId: "DEF2025006",
    name: "Col. Vikram Patel",
    rank: "Colonel",
    unit: "1st Airborne Division",
    relationType: "professional",
    phone: "+91 98765 43217",
    status: "offline",
    lastSeen: "1 day ago",
  },
];

// Pending Requests
export const MOCK_PENDING_REQUESTS: PendingRequest[] = [
  {
    id: "pr1",
    serviceId: "DEF2025010",
    name: "Sgt. Rohit Mehra",
    rank: "Sergeant",
    unit: "9th Infantry Regiment",
    relationType: "professional",
    phone: "+91 98765 43220",
    requestDate: "2 hours ago",
    message: "Requesting to join Alpha Squad communication",
  },
  {
    id: "pr2",
    serviceId: "DEF2025011",
    name: "Cpl. Neha Gupta",
    rank: "Corporal",
    unit: "6th Support Battalion",
    relationType: "professional",
    phone: "+91 98765 43221",
    requestDate: "1 day ago",
    message: "Need access to tactical updates",
  },
];

// Chats with Messages
export const MOCK_CHATS: Chat[] = [
  {
    id: "chat1",
    name: "Alpha Squad",
    type: "group",
    lastMessage: "@ArjunSingh Please review the mission brief",
    timestamp: "10:30 AM",
    unread: 3,
    members: ["c1", "c2", "c3", "c4"],
  },
  {
    id: "chat2",
    name: "Lt. Priya Nair",
    type: "direct",
    lastMessage: "The equipment has arrived",
    timestamp: "09:15 AM",
    unread: 1,
    members: ["c2"],
  },
  {
    id: "chat3",
    name: "Family Group",
    type: "group",
    lastMessage: "Stay safe beta!",
    timestamp: "Yesterday",
    unread: 0,
    members: ["c6", "c7"],
  },
  {
    id: "chat4",
    name: "Maj. Rakesh Sharma",
    type: "direct",
    lastMessage: "Meeting at 1500 hours",
    timestamp: "2 days ago",
    unread: 0,
    members: ["c3"],
  },
];

// Messages for chats
export const MOCK_MESSAGES: { [chatId: string]: Message[] } = {
  chat1: [
    {
      id: "m1",
      senderId: "c2",
      senderName: "Lt. Priya Nair",
      text: "@ArjunSingh Please review the mission brief",
      timestamp: "10:30 AM",
      mentions: ["c1"],
      type: "text",
    },
    {
      id: "m2",
      senderId: "c1",
      senderName: "Capt. Arjun Singh",
      text: "Roger that. Reviewing now.",
      timestamp: "10:32 AM",
      isStarred: true,
      type: "text",
    },
    {
      id: "m3",
      senderId: "c4",
      senderName: "Sgt. Manoj Kumar",
      text: "Equipment check completed",
      timestamp: "10:35 AM",
      type: "text",
    },
    {
      id: "m4",
      senderId: "c3",
      senderName: "Maj. Rakesh Sharma",
      text: "@ArjunSingh @PriyaNair Mission parameters confirmed",
      timestamp: "10:40 AM",
      mentions: ["c1", "c2"],
      isStarred: true,
      type: "text",
    },
  ],
  chat2: [
    {
      id: "m5",
      senderId: "c2",
      senderName: "Lt. Priya Nair",
      text: "The equipment has arrived",
      timestamp: "09:15 AM",
      type: "text",
    },
    {
      id: "m6",
      senderId: "c1",
      senderName: "You",
      text: "Great! I will inspect it this afternoon",
      timestamp: "09:20 AM",
      type: "text",
    },
  ],
  chat3: [
    {
      id: "m7",
      senderId: "c6",
      senderName: "Rajesh Singh",
      text: "How are you doing beta?",
      timestamp: "Yesterday",
      type: "text",
    },
    {
      id: "m8",
      senderId: "c7",
      senderName: "Sunita Singh",
      text: "Stay safe beta!",
      timestamp: "Yesterday",
      isStarred: true,
      type: "text",
    },
  ],
};

// Get starred messages across all chats
export const getStarredMessages = (): Array<
  Message & { chatId: string; chatName: string }
> => {
  const starred: Array<Message & { chatId: string; chatName: string }> = [];

  Object.entries(MOCK_MESSAGES).forEach(([chatId, messages]) => {
    const chat = MOCK_CHATS.find((c) => c.id === chatId);
    messages.forEach((message) => {
      if (message.isStarred) {
        starred.push({
          ...message,
          chatId,
          chatName: chat?.name || "Unknown",
        });
      }
    });
  });

  return starred;
};

// Get messages with mentions for current user
export const getMentionedMessages = (): Array<
  Message & { chatId: string; chatName: string }
> => {
  const mentioned: Array<Message & { chatId: string; chatName: string }> = [];
  const currentUserId = "c1"; // Current user ID

  Object.entries(MOCK_MESSAGES).forEach(([chatId, messages]) => {
    const chat = MOCK_CHATS.find((c) => c.id === chatId);
    messages.forEach((message) => {
      if (message.mentions?.includes(currentUserId)) {
        mentioned.push({
          ...message,
          chatId,
          chatName: chat?.name || "Unknown",
        });
      }
    });
  });

  return mentioned;
};

// Get contact by ID
export const getContactById = (id: string): Contact | undefined => {
  return MOCK_CONTACTS.find((c) => c.id === id);
};

// Add contact (approve request)
export const approveContactRequest = (requestId: string): Contact | null => {
  const request = MOCK_PENDING_REQUESTS.find((r) => r.id === requestId);
  if (!request) return null;

  const newContact: Contact = {
    id: `c${Date.now()}`,
    serviceId: request.serviceId,
    name: request.name,
    rank: request.rank,
    unit: request.unit,
    relation: request.relation,
    relationType: request.relationType,
    phone: request.phone,
    status: "offline",
  };

  MOCK_CONTACTS.push(newContact);
  return newContact;
};

// Remove pending request
export const removePendingRequest = (requestId: string): void => {
  const index = MOCK_PENDING_REQUESTS.findIndex((r) => r.id === requestId);
  if (index > -1) {
    MOCK_PENDING_REQUESTS.splice(index, 1);
  }
};

// Create new group
export const createNewGroup = (name: string, memberIds: string[]): Chat => {
  const newChat: Chat = {
    id: `chat${Date.now()}`,
    name,
    type: "group",
    lastMessage: "Group created",
    timestamp: "Just now",
    unread: 0,
    members: memberIds,
  };

  MOCK_CHATS.push(newChat);
  MOCK_MESSAGES[newChat.id] = [];
  return newChat;
};
