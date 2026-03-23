import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Message, ChatPartner } from '../types';

export function useChat() {
  const [selectedChatUser, setSelectedChatUser] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allChatMessages, setAllChatMessages] = useState<Message[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Media & Audio States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingTimerRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMessages = async (userId: string, partnerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    return data;
  };

  const sendMessage = async (senderId: string, receiverId: string, content: string, type: string = 'text') => {
    const { error } = await supabase.from('messages').insert([{
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      type: type,
    }]);
    return { error };
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    selectedChatUser, setSelectedChatUser,
    messages, setMessages,
    newMessage, setNewMessage,
    allChatMessages, setAllChatMessages,
    messagesEndRef,
    isRecording, setIsRecording,
    recordingTime, setRecordingTime,
    isUploading, setIsUploading,
    mediaRecorderRef, audioChunksRef, recordingTimerRef, fileInputRef,
    fetchMessages, sendMessage, formatTime,
  };
}
