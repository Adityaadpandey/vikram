export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: "image" | "video" | "pdf" | "document";
  url: string;
  name: string;
}
