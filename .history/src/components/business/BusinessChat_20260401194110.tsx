import React, { useState, useEffect, useRef } from "react";
import { IoChatbubbleEllipsesOutline, IoClose, IoSend, IoImageOutline, IoSearch } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useLocation } from "react-router-dom";
import { playNotificationSound } from '../../utils/notificationSound';

function authAxios(apiBaseUrl: string) {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: apiBaseUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
}
interface Client {
  id: number;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface Message {
  id: string | number;
  sender: "business" | "client";
  text?: string;
  message?: string;
  time: string;
  type?: 'image' | 'video' | null;
  content?: string;
  fileName?: string;
  createdAt?: string;
}

interface BusinessChatProps {
  businessSlug: string;
  apiBaseUrl?: string;
}

export default function BusinessChat({ 
  businessSlug,
  apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
}: BusinessChatProps) {
  const location = useLocation();
  const { pathname } = location;
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const activeChatRef = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [chatMessages, setChatMessages] = useState<{ [key: string]: Message[] }>({});
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [zoomedMedia, setZoomedMedia] = useState<{ type: 'image' | 'video', src: string } | null>(null);
  const [clickedMessageId, setClickedMessageId] = useState<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessageContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const businessSlugRef = useRef<string>(businessSlug);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { businessSlugRef.current = businessSlug; }, [businessSlug]);

  const currentMessages = chatMessages[activeChat || ''] || [];

  const scrollToBottom = () => {
    if (messageContainerRef.current) messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    if (mobileMessageContainerRef.current) mobileMessageContainerRef.current.scrollTop = mobileMessageContainerRef.current.scrollHeight;
  };

  useEffect(() => {
    if (isOpen) loadClients();
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = async (e: Event) => { 
      const customEvent = e as CustomEvent;
      const clientEmail = customEvent.detail?.clientEmail;
      setIsOpen(true);
      await loadClients();
      if (clientEmail) {
        setActiveChat(clientEmail);
        activeChatRef.current = clientEmail;
        setIsInitialLoad(true);
        loadMessages(clientEmail);
      }
    };
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [businessSlug]);

  // ── Socket.IO — force websocket transport, guaranteed room join ──
  useEffect(() => {
  let socketUrl = apiBaseUrl.replace(/\/api$/, '');
  console.log('🔗 Socket connecting to:', socketUrl);

  const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000
  });

  socketRef.current = socket;

  // ✅ Single connect handler - fires on every connect AND reconnect
  socket.on('connect', () => {
    console.log('✅ BusinessChat socket connected:', socket.id);
    if (businessSlugRef.current) {
      console.log('📤 Joining business room:', businessSlugRef.current);
      socket.emit('join-business', businessSlugRef.current);
    }
  });

  socket.on('connect_error', (err) => console.error('❌ Socket connect error:', err.message));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));

  socket.on('new-message', async (data) => {
    console.log('🔔 New message received by business:', data);
    await playNotificationSound();
    try { await loadClients(); } catch (e) { console.error(e); }
    if (data.clientEmail && activeChatRef.current === data.clientEmail) {
      try { await loadMessages(data.clientEmail, true); } catch (e) { console.error(e); }
    }
  });

  socket.on('typing', (data) => {
    if (data.sender === 'client') setIsClientTyping(data.isTyping);
  });

  if (Notification.permission === 'default') Notification.requestPermission();

  return () => {
    socket.off('connect');
    socket.off('connect_error');
    socket.off('disconnect');
    socket.off('new-message');
    socket.off('typing');
    socket.disconnect();
  };
}, [businessSlug, apiBaseUrl]);

  const hiddenRoutes = [
    '/business/login', '/business/signup', '/business/onboarding',
    '/business/forgot-password', '/business/reset-password'
  ];
  if (hiddenRoutes.some(route => pathname.startsWith(route))) return null;

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const api = authAxios(apiBaseUrl);
      const response = await api.get(`/chat/clients/${businessSlug}`);
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('❌ Error loading clients:', error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const loadMessages = async (clientEmail: string, skipLoadingState = false) => {
    if (!skipLoadingState) setIsLoadingMessages(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/chat/messages/business/${businessSlug}/${clientEmail}`);
      const formattedMessages = response.data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.message,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.messageType || null,
        content: msg.fileContent,
        fileName: msg.fileName,
        createdAt: msg.createdAt
      }));
      setChatMessages(prev => ({ ...prev, [clientEmail]: formattedMessages }));
      setTimeout(scrollToBottom, 150);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    } finally {
      if (!skipLoadingState) setIsLoadingMessages(false);
      setIsInitialLoad(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) {
      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (fileType) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target?.result;
          if (result && typeof result === 'string') {
            const tempId = `temp-${Date.now()}`;
            setChatMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), {
              id: tempId, sender: 'business', text: file.name,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: fileType, content: result, fileName: file.name, createdAt: new Date().toISOString()
            }]}));
            setTimeout(scrollToBottom, 50);
            try {
              await axios.post(`${apiBaseUrl}/chat/send-business`, { businessSlug, clientEmail: activeChat, message: file.name, messageType: fileType, fileContent: result });
              await loadMessages(activeChat, true);
            } catch {
              setChatMessages(prev => ({ ...prev, [activeChat]: prev[activeChat].filter(msg => msg.id !== tempId) }));
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    if (message.trim() && activeChat) {
      const messageText = message.trim();
      const tempId = `temp-${Date.now()}`;
      setChatMessages(prev => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), {
        id: tempId, sender: 'business', text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: null, createdAt: new Date().toISOString()
      }]}));
      setMessage("");
      setTimeout(scrollToBottom, 50);
      try {
        const api = authAxios(apiBaseUrl);
        await api.post(`/chat/send-business`, { clientEmail: activeChat, message: messageText });
        await loadMessages(activeChat, true);
      } catch {
        setChatMessages(prev => ({ ...prev, [activeChat]: prev[activeChat].filter(msg => msg.id !== tempId) }));
        setMessage(messageText);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleTyping = () => {
    if (socketRef.current && activeChat) {
      socketRef.current.emit('typing', { sender: 'business', businessSlug, clientEmail: activeChat, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { sender: 'business', businessSlug, clientEmail: activeChat, isTyping: false });
      }, 1500);
    }
  };

  const openClientChat = async (clientEmail: string) => {
    setActiveChat(clientEmail);
    activeChatRef.current = clientEmail;
    setIsInitialLoad(true);
    await loadMessages(clientEmail);
  };

  const closeChat = () => {
    setActiveChat(null);
    activeChatRef.current = null;
    setClickedMessageId(null);
    setIsInitialLoad(true);
  };

  const filteredClients = clients.filter(client =>
    client.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClient = clients.find(c => c.clientEmail === activeChat);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatTimestamp = (createdAt: string) => {
    const messageDate = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const timeStr = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (messageDate.toDateString() === today.toDateString()) return timeStr;
    if (messageDate.toDateString() === yesterday.toDateString()) return `Yesterday ${timeStr}`;
    return `${messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  const handleMessageClick = (msgId: string | number) => setClickedMessageId(clickedMessageId === msgId ? null : msgId);

  const renderMessage = (msg: Message) => {
    if (msg.type === 'image') return <img src={msg.content} alt={msg.fileName} className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setZoomedMedia({ type: 'image', src: msg.content || '' })} />;
    if (msg.type === 'video') return <video src={msg.content} controls className="max-w-full rounded-lg" onClick={() => setZoomedMedia({ type: 'video', src: msg.content || '' })} />;
    return <p className="text-sm">{msg.text || msg.message}</p>;
  };

  const clientListJSX = (
    <>
      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="font-medium text-lg">Messages</h2>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          {FaAngleDown({ size: 20, className: "text-gray-600" })}
        </button>
      </div>
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          {IoSearch({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 })}
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm" />
        </div>
      </div>
      <div className="h-96 overflow-y-auto">
        {isLoadingClients ? (
          <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading clients...</p></div>
        ) : filteredClients.length === 0 ? (
          <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">No conversations yet</p></div>
        ) : filteredClients.map((client) => (
          <div key={client.clientEmail} onClick={() => openClientChat(client.clientEmail)}
            className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                {getInitials(client.clientName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">{client.clientName}</h3>
                  <span className="text-xs text-gray-500 ml-2">{client.lastMessageTime}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{client.clientEmail}</p>
                <p className="text-xs text-gray-600 truncate mt-1">{client.lastMessage}</p>
              </div>
              {client.unread > 0 && (
                <div className="w-5 h-5 bg-primaryGreen text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {client.unread}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const activeChatJSX = (mobile = false) => (
    <>
      <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={closeChat} className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            {FaChevronLeft({ size: 18, className: "text-gray-600" })}
          </button>
          <div className="w-10 h-10 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
            {activeClient && getInitials(activeClient.clientName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{activeClient?.clientName}</h3>
            <p className="text-xs text-gray-500 truncate">{activeClient?.clientEmail}</p>
          </div>
        </div>
        {!mobile && (
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            {FaAngleDown({ size: 20, className: "text-gray-600" })}
          </button>
        )}
      </div>

      <div className={`overflow-y-auto p-4 bg-gray-50 ${mobile ? 'flex-1' : 'h-96'}`}
        ref={mobile ? mobileMessageContainerRef : messageContainerRef}>
        {isLoadingMessages && isInitialLoad ? (
          <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading messages...</p></div>
        ) : currentMessages.length === 0 ? (
          <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">Start the conversation!</p></div>
        ) : currentMessages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex flex-col ${msg.sender === "business" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${msg.sender === "business" ? "bg-primaryGreen text-white" : "bg-white border border-gray-200"}`}
              onClick={() => handleMessageClick(msg.id)}>
              {renderMessage(msg)}
            </div>
            {clickedMessageId === msg.id && msg.createdAt && (
              <span className={`text-xs mt-1 px-1 ${msg.sender === "business" ? "text-gray-600" : "text-gray-500"}`}>
                {formatTimestamp(msg.createdAt)}
              </span>
            )}
          </div>
        ))}
        {isClientTyping && (
          <div className="flex items-start mb-3">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            {IoImageOutline({ size: 20 })}
          </button>
          <input type="text" value={message}
            onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
            onKeyPress={handleKeyPress} placeholder="Message"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm" />
          <button onClick={handleSendMessage} className="hidden lg:block p-2 bg-primaryGreen text-white rounded-full hover:bg-hoverGreen transition-colors">
            {IoSend({ size: 20 })}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />

      {zoomedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4" onClick={() => setZoomedMedia(null)}>
          <button onClick={() => setZoomedMedia(null)} className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10">×</button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {zoomedMedia.type === 'image'
              ? <img src={zoomedMedia.src} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
              : <video src={zoomedMedia.src} controls autoPlay className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />}
          </div>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200">
            {!activeChat ? clientListJSX : activeChatJSX(false)}
          </div>
        )}
        {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="bg-primaryGreen text-white p-4 rounded-full shadow-lg hover:bg-hoverGreen transition-colors">
            {IoChatbubbleEllipsesOutline({ size: 25 })}
          </button>
        )}
      </div>

      {/* MOBILE */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {!activeChat ? (
            <>
              <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg">Messages</h2>
                  <button onClick={() => setIsOpen(false)} className="p-2">{IoClose({ size: 24 })}</button>
                </div>
                <div className="relative">
                  {IoSearch({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 })}
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages"
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoadingClients ? (
                  <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading clients...</p></div>
                ) : filteredClients.length === 0 ? (
                  <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">No conversations yet</p></div>
                ) : filteredClients.map((client) => (
                  <div key={client.clientEmail} onClick={() => openClientChat(client.clientEmail)}
                    className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0">
                        {getInitials(client.clientName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base truncate">{client.clientName}</h3>
                          <span className="text-xs text-gray-500 ml-2">{client.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{client.clientEmail}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{client.lastMessage}</p>
                      </div>
                      {client.unread > 0 && (
                        <div className="w-6 h-6 bg-primaryGreen text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {client.unread}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeChatJSX(true)}
        </div>
      )}
    </>
  );
}