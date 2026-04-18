// types/index.ts
export interface User {
  uid: string;
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  uid: string;
  content: string;
  imageURL?: string;
  createdAt: Date;
  likes: string[];
  commentsCount: number;
  author?: User;
}

export interface Comment {
  id: string;
  postId: string;
  uid: string;
  content: string;
  createdAt: Date;
  author?: User;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Date;
  otherUser?: User;
}