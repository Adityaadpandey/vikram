// Type definitions based on your API response
export interface Message {
  message_id: string;
  content?: {
    text: string;
    image_url: string | null;
    video_url: string | null;
    file_url: string | null;
    file_name: string | null;
    mime_type: string | null;
    thumbnail_url: string | null;
  };
  status?: string;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  sender: {
    name: string;
    user_reg_id: string;
  };
  reply_to_message_id: string | null;
  reply_to: {
    message_id: string;
    content: {
      text: string;
    };
    sender: {
      name: string;
      user_reg_id: string;
    };
  } | null;
  reactions: Array<{
    reaction_id: string;
    emoji: string;
    user: {
      name: string;
      user_reg_id: string;
    };
    created_at: string;
  }>;
  _count: {
    replies: number;
    reactions: number;
  };
}

export interface ChatData {
  messages: Message[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalMessages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  subject: {
    subject_id: string;
    name: string;
  };
}
