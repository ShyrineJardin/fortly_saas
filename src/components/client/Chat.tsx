import React, { useState, useEffect, useRef } from "react";
import { IoChatbubbleEllipsesOutline, IoSend, IoImageOutline } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { playNotificationSound, preloadNotificationSound } from '../../utils/notificationSound';

interface ChatWidgetProps {
  businessSlug: string;
  apiBaseUrl?: string;
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

const setLocalStorageWithEvent = (key: string, value: string) => {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('localStorageUpdate', { detail: { key, value } }));
};

const WelcomeForm = ({
  userName, setUserName, userEmail, setUserEmail,
  onSubmit, onSwitchToReturning, isLoading, emailPrefilled
}: {
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToReturning: () => void;
  isLoading: boolean;
  emailPrefilled?: boolean;
}) => (
  <div className="p-6 bg-gray-50 h-full flex flex-col justify-center">
    <div className="mb-3 text-center">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">👋 Welcome!</h3>
      <p className="text-sm text-gray-600">We'd love to chat with you. Let's get started!</p>
    </div>
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">What's your name?</label>
        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name" required
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen" />
      </div>
      {!emailPrefilled ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">And your email?</label>
          <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
            placeholder="your@email.com" required
            className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen" />
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-green-500 text-base">✓</span>
          <div>
            <p className="text-xs text-green-700 font-medium">Email detected</p>
            <p className="text-sm text-green-800 font-semibold">{userEmail}</p>
          </div>
        </div>
      )}
      <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? 'Starting Chat...' : 'Start Chatting 💬'}
      </button>
    </form>
    {!emailPrefilled && (
      <div className="mt-3 pt-2 border-t border-gray-300">
        <p className="text-xs text-gray-600 text-center mb-2">Already chatted with us before?</p>
        <button type="button" onClick={onSwitchToReturning} className="w-full text-sm text-primaryGreen hover:text-hoverGreen font-medium transition-colors">
          Continue with existing email →
        </button>
      </div>
    )}
  </div>
);

const ReturningUserForm = ({
  userEmail, setUserEmail, onSubmit, onSwitchToNew, error, isLoading
}: {
  userEmail: string;
  setUserEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToNew: () => void;
  error: string;
  isLoading: boolean;
}) => (
  <div className="p-6 bg-gray-50 h-full flex flex-col justify-center">
    <div className="mb-6 text-center">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome Back! 👋</h3>
      <p className="text-sm text-gray-600">Enter your email to continue your conversation</p>
    </div>
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your email</label>
        <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
          placeholder="your@email.com" required
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen" />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
      <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? 'Loading...' : 'Continue Conversation'}
      </button>
    </form>
    <p className="text-xs text-gray-500 text-center mt-6">
      Don't have a conversation yet?{' '}
      <button type="button" onClick={onSwitchToNew} className="text-primaryGreen hover:text-hoverGreen font-medium">Start a new one</button>
    </p>
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-start mb-3">
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
      <div className="flex gap-1 items-center h-4">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

export default function ChatWidget({
  businessSlug,
  apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcomeForm, setShowWelcomeForm] = useState(false);
  const [showReturningForm, setShowReturningForm] = useState(false);
  const [emailPrefilled, setEmailPrefilled] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [returningEmail, setReturningEmail] = useState("");
  const [returningError, setReturningError] = useState("");
  const [isLoadingReturning, setIsLoadingReturning] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [businessName, setBusinessName] = useState("Business Name");
  const [businessLogo, setBusinessLogo] = useState("");
  const [zoomedMedia, setZoomedMedia] = useState<{ type: 'image' | 'video', src: string } | null>(null);
  const [clickedMessageId, setClickedMessageId] = useState<string | number | null>(null);
  const [isSubmittingWelcome, setIsSubmittingWelcome] = useState(false);
  const [isBusinessTyping, setIsBusinessTyping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessageContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Refs to avoid stale closures in socket handlers ──
  const userEmailRef = useRef<string>("");
  const userNameRef = useRef<string>("");
  const businessSlugRef = useRef<string>(businessSlug);

  useEffect(() => { userEmailRef.current = userEmail; }, [userEmail]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { businessSlugRef.current = businessSlug; }, [businessSlug]);

  const scrollToBottom = () => {
    if (messageContainerRef.current) messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    if (mobileMessageContainerRef.current) mobileMessageContainerRef.current.scrollTop = mobileMessageContainerRef.current.scrollHeight;
  };

  // ── Init: load stored credentials ──
  useEffect(() => {
    const storedName  = localStorage.getItem(`chat_${businessSlug}_name`);
    const storedEmail = localStorage.getItem(`chat_${businessSlug}_email`);
    const fallbackEmail =
      localStorage.getItem(`appointment_${businessSlug}_email`) ||
      localStorage.getItem(`booking_${businessSlug}_email`) || "";

    fetchBusinessDetails();

    if (storedName && storedEmail) {
      setUserName(storedName);
      setUserEmail(storedEmail);
      loadMessages(storedEmail);
    } else if (fallbackEmail) {
      setUserEmail(fallbackEmail);
      setEmailPrefilled(true);
      setLocalStorageWithEvent(`chat_${businessSlug}_email`, fallbackEmail);
      loadMessages(fallbackEmail).then((hasMessages) => {
        setShowWelcomeForm(!hasMessages);
      });
    } else {
      setShowWelcomeForm(true);
    }
  }, [businessSlug]);

  useEffect(() => {
    if (isOpen && messages.length > 0) setTimeout(scrollToBottom, 100);
  }, [isOpen]);

  // ── Event listeners ──
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);

    const handleLocalStorageUpdate = (e: CustomEvent) => {
      const relevantKeys = [`appointment_${businessSlug}_email`, `booking_${businessSlug}_email`];
      if (relevantKeys.includes(e.detail.key) && !userEmailRef.current) {
        const newEmail =
          localStorage.getItem(`appointment_${businessSlug}_email`) ||
          localStorage.getItem(`booking_${businessSlug}_email`) || "";
        if (newEmail) {
          setUserEmail(newEmail);
          setEmailPrefilled(true);
          localStorage.setItem(`chat_${businessSlug}_email`, newEmail);
          loadMessages(newEmail).then((hasMessages) => setShowWelcomeForm(!hasMessages));
        }
      }
    };
    window.addEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);

    return () => {
      window.removeEventListener('openChat', handleOpenChat);
      window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);
    };
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
    console.log('✅ ChatWidget socket connected:', socket.id);
    if (businessSlugRef.current && userEmailRef.current) {
      console.log('📤 Joining client room:', businessSlugRef.current, userEmailRef.current);
      socket.emit('join-client', {
        businessSlug: businessSlugRef.current,
        clientEmail: userEmailRef.current
      });
    }
  });

  socket.on('connect_error', (err) => console.error('❌ Socket connect error:', err.message));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));

  socket.on('new-message', async (data) => {
    if (data.sender !== 'business') return;
    console.log('🔔 New message from business:', data);
    await playNotificationSound();
    const currentEmail = userEmailRef.current;
    if (currentEmail) await loadMessages(currentEmail, true);
  });

  socket.on('typing', (data) => {
    if (data.sender === 'business') setIsBusinessTyping(data.isTyping);
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

// ✅ Re-join when email becomes available (handles late email load)
useEffect(() => {
  if (!userEmail || !socketRef.current) return;
  const socket = socketRef.current;

  const joinClientRoom = () => {
    console.log('📤 Re-joining client room with email:', userEmail);
    socket.emit('join-client', { businessSlug, clientEmail: userEmail });
  };

  if (socket.connected) {
    joinClientRoom();
  } else {
    socket.once('connect', joinClientRoom);
    return () => { socket.off('connect', joinClientRoom); };
  }
}, [userEmail, businessSlug]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/business/${businessSlug}`);
      const business = response.data.business;
      if (business) {
        setBusinessName(business.businessName || "Business Name");
        setBusinessLogo(business.logo || "");
      }
    } catch { setBusinessName("Business Name"); }
  };

  const handleTyping = () => {
    const email = userEmailRef.current;
    const name = userNameRef.current;
    if (socketRef.current && email) {
      socketRef.current.emit('typing', { sender: 'client', businessSlug, clientEmail: email, clientName: name, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { sender: 'client', businessSlug, clientEmail: email, clientName: name, isTyping: false });
      }, 1500);
    }
  };

  const loadMessages = async (email: string, skipLoadingState = false): Promise<boolean> => {
    if (!skipLoadingState) setIsLoadingMessages(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/chat/messages/client/${businessSlug}/${email}`);
      const formattedMessages = response.data.messages.map((msg: any) => ({
        id: msg.id, sender: msg.sender, text: msg.message,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msg.messageType || null, content: msg.fileContent, fileName: msg.fileName, createdAt: msg.createdAt
      }));
      setMessages(formattedMessages);
      if (!userNameRef.current && formattedMessages.length > 0) {
        const clientMsg = response.data.messages.find((m: any) => m.sender === 'client');
        if (clientMsg?.clientName) {
          setUserName(clientMsg.clientName);
          localStorage.setItem(`chat_${businessSlug}_name`, clientMsg.clientName);
        }
      }
      requestAnimationFrame(() => {
        if (messageContainerRef.current) messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        if (mobileMessageContainerRef.current) mobileMessageContainerRef.current.scrollTop = mobileMessageContainerRef.current.scrollHeight;
      });
      return formattedMessages.length > 0;
    } catch { return false; }
    finally {
      if (!skipLoadingState) setIsLoadingMessages(false);
      setIsInitialLoad(false);
    }
  };

  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setIsSubmittingWelcome(true);
    localStorage.setItem(`chat_${businessSlug}_name`, userName);
    setLocalStorageWithEvent(`chat_${businessSlug}_email`, userEmail);
    if (!localStorage.getItem(`appointment_${businessSlug}_email`)) {
      setLocalStorageWithEvent(`appointment_${businessSlug}_email`, userEmail);
    }
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-client', { businessSlug, clientEmail: userEmail });
    }
    setShowWelcomeForm(false);
    try {
      await axios.post(`${apiBaseUrl}/chat/send-client`, {
        businessSlug, clientEmail: userEmail, clientName: userName,
        message: `Hi! I'm ${userName}. I'd like to get in touch.`
      });
      await loadMessages(userEmail);
    } catch { console.error('Error sending initial message'); }
    finally { setIsSubmittingWelcome(false); }
  };

  const handleReturningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturningError("");
    setIsLoadingReturning(true);
    if (returningEmail.trim()) {
      try {
        const response = await axios.get(`${apiBaseUrl}/chat/messages/client/${businessSlug}/${returningEmail}`);
        if (response.data.messages && response.data.messages.length > 0) {
          const clientName = response.data.messages.find((m: any) => m.sender === 'client')?.clientName || "User";
          localStorage.setItem(`chat_${businessSlug}_name`, clientName);
          setLocalStorageWithEvent(`chat_${businessSlug}_email`, returningEmail);
          setUserName(clientName);
          setUserEmail(returningEmail);
          setShowReturningForm(false);
          setShowWelcomeForm(false);
          if (socketRef.current?.connected) {
            socketRef.current.emit('join-client', { businessSlug, clientEmail: returningEmail });
          }
          await loadMessages(returningEmail);
        } else {
          setReturningError("No conversation found with this email. Please start a new chat.");
        }
      } catch { setReturningError("No conversation found with this email. Please start a new chat."); }
      finally { setIsLoadingReturning(false); }
    }
  };

  const switchToReturningForm = () => { setShowWelcomeForm(false); setShowReturningForm(true); setReturningEmail(""); setReturningError(""); };
  const switchToWelcomeForm = () => { setShowReturningForm(false); setShowWelcomeForm(true); setUserName(""); setUserEmail(""); setEmailPrefilled(false); };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const email = userEmailRef.current;
    if (file && email) {
      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (fileType) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target?.result;
          if (result && typeof result === 'string') {
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, {
              id: tempId, sender: 'client', text: file.name,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: fileType, content: result, fileName: file.name, createdAt: new Date().toISOString()
            }]);
            setTimeout(scrollToBottom, 50);
            try {
              await axios.post(`${apiBaseUrl}/chat/send-client`, { businessSlug, clientEmail: email, clientName: userNameRef.current, message: file.name, messageType: fileType, fileContent: result });
              await loadMessages(email, true);
            } catch { setMessages(prev => prev.filter(msg => msg.id !== tempId)); }
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    const email = userEmailRef.current;
    if (message.trim() && email) {
      const messageText = message.trim();
      const tempId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempId, sender: 'client', text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: null, createdAt: new Date().toISOString()
      }]);
      setMessage("");
      setTimeout(scrollToBottom, 50);
      try {
        await axios.post(`${apiBaseUrl}/chat/send-client`, { businessSlug, clientEmail: email, clientName: userNameRef.current, message: messageText });
        await loadMessages(email, true);
      } catch {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setMessage(messageText);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

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
    if (msg.type === 'video') return <video src={msg.content} controls className="max-w-full rounded-lg cursor-pointer" onClick={() => setZoomedMedia({ type: 'video', src: msg.content || '' })} />;
    return <p className="text-sm">{msg.text || msg.message}</p>;
  };

  const messageListJSX = (containerRef: React.RefObject<HTMLDivElement>) => (
    <div className="overflow-y-auto p-4 bg-gray-50 h-full" ref={containerRef} style={{ scrollBehavior: 'auto' }}>
      {isLoadingMessages && isInitialLoad ? (
        <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading messages...</p></div>
      ) : messages.length === 0 ? (
        <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">Start the conversation!</p></div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${msg.sender === "client" ? "bg-primaryGreen text-white" : "bg-white border border-gray-200"}`}
              onClick={() => handleMessageClick(msg.id)}
            >
              {renderMessage(msg)}
            </div>
            {clickedMessageId === msg.id && msg.createdAt && (
              <span className={`text-xs mt-1 px-1 ${msg.sender === "client" ? "text-gray-600" : "text-gray-500"}`}>
                {formatTimestamp(msg.createdAt)}
              </span>
            )}
          </div>
        ))
      )}
      {isBusinessTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );

  const inputBarJSX = (mobile = false) => (
    <div className={`bg-white border-t border-gray-200 flex-shrink-0 ${mobile ? 'px-4 py-3' : 'p-4'}`}>
      <div className="flex items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()} className={`p-2 text-gray-500 flex-shrink-0 ${mobile ? '' : 'hover:bg-gray-100 rounded-full transition-colors'}`}>
          {IoImageOutline({ size: 22 })}
        </button>
        <input
          type="text"
          enterKeyHint="send"
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          onKeyPress={handleKeyPress}
          placeholder="Message"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
        />
        <button onClick={handleSendMessage} className={`p-2 flex-shrink-0 ${mobile ? 'text-primaryGreen' : 'bg-primaryGreen text-white rounded-full hover:bg-hoverGreen transition-colors'}`}>
          {IoSend({ size: mobile ? 24 : 20 })}
        </button>
      </div>
    </div>
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

      {/* ==================== DESKTOP ==================== */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200 flex flex-col" style={{ height: '480px' }}>
            <div className="bg-white p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                {businessLogo
                  ? <img src={businessLogo} alt={businessName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />}
                <span className="font-semibold text-sm">{businessName}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                {FaAngleDown({ size: 20, className: "text-gray-600" })}
              </button>
            </div>

            {showWelcomeForm ? (
              <div className="flex-1 overflow-y-auto">
                <WelcomeForm userName={userName} setUserName={setUserName} userEmail={userEmail} setUserEmail={setUserEmail}
                  onSubmit={handleWelcomeSubmit} onSwitchToReturning={switchToReturningForm}
                  isLoading={isSubmittingWelcome} emailPrefilled={emailPrefilled} />
              </div>
            ) : showReturningForm ? (
              <div className="flex-1 overflow-y-auto">
                <ReturningUserForm userEmail={returningEmail} setUserEmail={setReturningEmail}
                  onSubmit={handleReturningSubmit} onSwitchToNew={switchToWelcomeForm}
                  error={returningError} isLoading={isLoadingReturning} />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-hidden">
                  {messageListJSX(messageContainerRef)}
                </div>
                {inputBarJSX(false)}
              </>
            )}
          </div>
        )}

        {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="bg-primaryGreen text-white p-4 rounded-full shadow-lg hover:bg-hoverGreen transition-colors" title="Open Chat">
            {IoChatbubbleEllipsesOutline({ size: 25 })}
          </button>
        )}
      </div>

      {/* ==================== MOBILE ==================== */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(false)} className="p-2 -ml-2">{FaChevronLeft({ size: 20 })}</button>
              {businessLogo
                ? <img src={businessLogo} alt={businessName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />}
              <span className="font-semibold md:text-base text-sm">{businessName}</span>
            </div>
          </div>

          {showWelcomeForm ? (
            <div className="flex-1 overflow-y-auto">
              <WelcomeForm userName={userName} setUserName={setUserName} userEmail={userEmail} setUserEmail={setUserEmail}
                onSubmit={handleWelcomeSubmit} onSwitchToReturning={switchToReturningForm}
                isLoading={isSubmittingWelcome} emailPrefilled={emailPrefilled} />
            </div>
          ) : showReturningForm ? (
            <div className="flex-1 overflow-y-auto">
              <ReturningUserForm userEmail={returningEmail} setUserEmail={setReturningEmail}
                onSubmit={handleReturningSubmit} onSwitchToNew={switchToWelcomeForm}
                error={returningError} isLoading={isLoadingReturning} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                {messageListJSX(mobileMessageContainerRef)}
              </div>
              {inputBarJSX(true)}
            </>
          )}
        </div>
      )}
    </>
  );
}