import React, { useState, useEffect, useRef } from 'react';
import { IoSend } from 'react-icons/io5';

interface Message {
  id: string;
  message: string;
  sender: 'client' | 'business';
  messageType: 'text' | 'image' | 'video';
  fileContent?: string;
  fileName?: string;
  createdAt: string;
}

interface ChatPanelProps {
  clientEmail: string;
  clientName: string;
  userRole: 'business' | 'client';
  businessEmail?: string;
  businessName?: string;
  fetchMessages?: (clientEmail: string) => Promise<Message[]>;
  sendMessageAPI?: (data: {
    clientEmail: string;
    message: string;
    sender: 'business' | 'client';
  }) => Promise<Message>;
}

export default function ChatPanel({ 
  clientEmail, 
  clientName, 
  userRole,
  businessEmail,
  businessName,
  fetchMessages,
  sendMessageAPI
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [clientEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      if (fetchMessages) {
        const data = await fetchMessages(clientEmail);
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !sendMessageAPI) return;

    try {
      setIsSending(true);
      const response = await sendMessageAPI({
        clientEmail,
        message: newMessage,
        sender: userRole
      });
      
      setMessages(prev => [...prev, response]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-textSecondaryColor">Loading chat history...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);
  const chatPartnerName = userRole === 'business' ? clientName : businessName || 'Business';
  const chatPartnerEmail = userRole === 'business' ? clientEmail : businessEmail || '';

  return (
    <div className="flex flex-col h-[400px] md:h-[500px]">
      {/* Chat Header */}
      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primaryGreen rounded-full flex items-center justify-center text-white font-bold">
            {chatPartnerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-textPrimaryColor">{chatPartnerName}</h3>
            {chatPartnerEmail && (
              <p className="text-sm text-textSecondaryColor">{chatPartnerEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-softGreen rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-hoverGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-textPrimaryColor mb-2">No messages yet</h3>
            <p className="text-sm text-textSecondaryColor">Start a conversation with {chatPartnerName}</p>
          </div>
        ) : (
          Object.keys(messageGroups).map(dateKey => (
            <div key={dateKey}>
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-xs text-textSecondaryColor font-semibold">
                    {formatDate(dateKey)}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {messageGroups[dateKey].map(message => {
                const isCurrentUser = (userRole === 'business' && message.sender === 'business') || 
                                     (userRole === 'client' && message.sender === 'client');
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-hoverGreen text-white rounded-br-sm'
                          : 'bg-gray-100 text-textPrimaryColor rounded-bl-sm'
                      }`}
                    >
                      {message.messageType === 'text' ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      ) : message.messageType === 'image' ? (
                        <div>
                          <img
                            src={`data:image/jpeg;base64,${message.fileContent}`}
                            alt={message.fileName}
                            className="rounded-lg max-w-full h-auto mb-2"
                          />
                          {message.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                          )}
                        </div>
                      ) : message.messageType === 'video' ? (
                        <div>
                          <video
                            controls
                            className="rounded-lg max-w-full h-auto mb-2"
                          >
                            <source src={`data:video/mp4;base64,${message.fileContent}`} type="video/mp4" />
                          </video>
                          {message.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                          )}
                        </div>
                      ) : null}
                      <p className={`text-[10px] mt-1 ${
                        isCurrentUser ? 'text-white/70' : 'text-textSecondaryColor'
                      }`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {sendMessageAPI && (
        <form onSubmit={handleSendMessage} className="border-t border-border pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message..."
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-xl resize-none focus:outline-none focus:border-hoverGreen"
                disabled={isSending}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-hoverGreen text-white p-3 rounded-xl hover:bg-primaryGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <IoSend className="text-xl" />
              )}
            </button>
          </div>
          <p className="text-xs text-textSecondaryColor mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      )}
    </div>
  );
}