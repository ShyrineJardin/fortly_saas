import React, { useState, useEffect, useRef } from "react";
import { IoChatbubbleEllipsesOutline, IoSend, IoImageOutline } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

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

// ── Welcome form — hides email field if already known from appointment/booking ──
const WelcomeForm = ({
  userName,
  setUserName,
  userEmail,
  setUserEmail,
  onSubmit,
  onSwitchToReturning,
  isLoading,
  emailPrefilled
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
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
          required
        />
      </div>

      {/* Only show email input if not already detected from another widget */}
      {!emailPrefilled ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">And your email?</label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="your@email.com"
            className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
            required
          />
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Starting Chat...' : 'Start Chatting 💬'}
      </button>
    </form>

    {/* Only show "returning user" link if email isn't already prefilled */}
    {!emailPrefilled && (
      <div className="mt-3 pt-2 border-t border-gray-300">
        <p className="text-xs text-gray-600 text-center mb-2">Already chatted with us before?</p>
        <button
          type="button"
          onClick={onSwitchToReturning}
          className="w-full text-sm text-primaryGreen hover:text-hoverGreen font-medium transition-colors"
        >
          Continue with existing email →
        </button>
      </div>
    )}
  </div>
);

const ReturningUserForm = ({
  userEmail,
  setUserEmail,
  onSubmit,
  onSwitchToNew,
  error,
  isLoading
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
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="your@email.com"
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
          required
        />
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Continue Conversation'}
      </button>
    </form>

    <p className="text-xs text-gray-500 text-center mt-6">
      Don't have a conversation yet?{' '}
      <button type="button" onClick={onSwitchToNew} className="text-primaryGreen hover:text-hoverGreen font-medium">
        Start a new one
      </button>
    </p>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessageContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [notificationSound] = useState(new Audio('/notification.mp3'));
  const [isSubmittingWelcome, setIsSubmittingWelcome] = useState(false);
  const [isBusinessTyping, setIsBusinessTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
    if (mobileMessageContainerRef.current) {
      mobileMessageContainerRef.current.scrollTop = mobileMessageContainerRef.current.scrollHeight;
    }
  };

  // ── On mount: resolve email from chat keys first, then sibling widget keys ──
  useEffect(() => {
    const storedName  = localStorage.getItem(`chat_${businessSlug}_name`);
    const storedEmail = localStorage.getItem(`chat_${businessSlug}_email`);

    // Sibling keys set by AppointmentWidget or BookingPage
    const fallbackEmail =
      localStorage.getItem(`appointment_${businessSlug}_email`) ||
      localStorage.getItem(`booking_${businessSlug}_email`) ||
      "";

    fetchBusinessDetails();

    if (storedName && storedEmail) {
      // ── Full chat identity found — load normally ──
      setUserName(storedName);
      setUserEmail(storedEmail);
      loadMessages(storedEmail);
    } else if (fallbackEmail) {
      // ── Email known from another widget — pre-fill and check for prior chat ──
      setUserEmail(fallbackEmail);
      setEmailPrefilled(true);
      // Save so chat recognises it going forward
      localStorage.setItem(`chat_${businessSlug}_email`, fallbackEmail);

      loadMessages(fallbackEmail).then((hasMessages) => {
        if (hasMessages) {
          // Prior chat exists — restore name from first message if available
          // (loadMessages already set the messages state; name restored below)
          setShowWelcomeForm(false);
        } else {
          // No prior chat — show welcome form with email pre-filled, only ask name
          setShowWelcomeForm(true);
        }
      });
    } else {
      // ── No email anywhere — show full welcome form ──
      setShowWelcomeForm(true);
    }
  }, [businessSlug]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    if (userEmail && businessSlug) {
      const socketUrl = apiBaseUrl.replace('/api', '');
      socketRef.current = io(socketUrl);

      socketRef.current.emit('join-client', { businessSlug, clientEmail: userEmail });

      socketRef.current.on('new-message', (data) => {
        notificationSound.play().catch(() => {});
        loadMessages(userEmail, true);
        if (document.hidden && Notification.permission === 'granted') {
          new Notification(`New message from ${data.businessName}`, {
            body: data.message.message || 'New file received',
            icon: '/logo192.png',
          });
        }
      });

      socketRef.current.on('typing', (data) => {
        if (data.sender === 'business') setIsBusinessTyping(data.isTyping);
      });

      if (Notification.permission === 'default') Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-message');
        socketRef.current.off('typing');
        socketRef.current.disconnect();
      }
    };
  }, [userEmail, businessSlug, apiBaseUrl]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/business/${businessSlug}`);
      const business = response.data.business;
      if (business) {
        setBusinessName(business.businessName || "Business Name");
        setBusinessLogo(business.logo || "");
      }
    } catch {
      setBusinessName("Business Name");
    }
  };

  const handleTyping = () => {
    if (socketRef.current && userEmail) {
      socketRef.current.emit('typing', {
        sender: 'client', businessSlug, clientEmail: userEmail, clientName: userName, isTyping: true
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          sender: 'client', businessSlug, clientEmail: userEmail, clientName: userName, isTyping: false
        });
      }, 1500);
    }
  };

  // ── Returns true if messages were found (used by fallback email logic) ──
  const loadMessages = async (email: string, skipLoadingState = false): Promise<boolean> => {
    if (!skipLoadingState) setIsLoadingMessages(true);
    try {
      const response = await axios.get(
        `${apiBaseUrl}/chat/messages/client/${businessSlug}/${email}`
      );
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
      setMessages(formattedMessages);

      // Restore name from messages if not already set
      if (!userName && formattedMessages.length > 0) {
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
    } catch {
      return false;
    } finally {
      if (!skipLoadingState) setIsLoadingMessages(false);
      setIsInitialLoad(false);
    }
  };

  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    setIsSubmittingWelcome(true);

    localStorage.setItem(`chat_${businessSlug}_name`, userName);
    localStorage.setItem(`chat_${businessSlug}_email`, userEmail);
    // ── Also write to appointment key so AppointmentWidget benefits ──
    if (!localStorage.getItem(`appointment_${businessSlug}_email`)) {
      localStorage.setItem(`appointment_${businessSlug}_email`, userEmail);
    }

    setShowWelcomeForm(false);
    try {
      await axios.post(`${apiBaseUrl}/chat/send-client`, {
        businessSlug, clientEmail: userEmail, clientName: userName,
        message: `Hi! I'm ${userName}. I'd like to get in touch.`
      });
      await loadMessages(userEmail);
    } catch {
      console.error('Error sending initial message');
    } finally {
      setIsSubmittingWelcome(false);
    }
  };

  const handleReturningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturningError("");
    setIsLoadingReturning(true);

    if (returningEmail.trim()) {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/chat/messages/client/${businessSlug}/${returningEmail}`
        );
        if (response.data.messages && response.data.messages.length > 0) {
          const clientName = response.data.messages.find((m: any) => m.sender === 'client')?.clientName || "User";
          localStorage.setItem(`chat_${businessSlug}_name`, clientName);
          localStorage.setItem(`chat_${businessSlug}_email`, returningEmail);
          setUserName(clientName);
          setUserEmail(returningEmail);
          setShowReturningForm(false);
          setShowWelcomeForm(false);
          await loadMessages(returningEmail);
        } else {
          setReturningError("No conversation found with this email. Please start a new chat.");
        }
      } catch {
        setReturningError("No conversation found with this email. Please start a new chat.");
      } finally {
        setIsLoadingReturning(false);
      }
    }
  };

  const switchToReturningForm = () => {
    setShowWelcomeForm(false);
    setShowReturningForm(true);
    setReturningEmail("");
    setReturningError("");
  };

  const switchToWelcomeForm = () => {
    setShowReturningForm(false);
    setShowWelcomeForm(true);
    setUserName("");
    setUserEmail("");
    setEmailPrefilled(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userEmail) {
      const fileType = file.type.startsWith('image/') ? 'image' :
                       file.type.startsWith('video/') ? 'video' : null;
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
              await axios.post(`${apiBaseUrl}/chat/send-client`, {
                businessSlug, clientEmail: userEmail, clientName: userName,
                message: file.name, messageType: fileType, fileContent: result
              });
              await loadMessages(userEmail, true);
            } catch {
              setMessages(prev => prev.filter(msg => msg.id !== tempId));
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleSendMessage = async () => {
    if (message.trim() && userEmail) {
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
        await axios.post(`${apiBaseUrl}/chat/send-client`, {
          businessSlug, clientEmail: userEmail, clientName: userName, message: messageText
        });
        await loadMessages(userEmail, true);
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

  const handleMessageClick = (msgId: string | number) => {
    setClickedMessageId(clickedMessageId === msgId ? null : msgId);
  };

  const renderMessage = (msg: Message) => {
    if (msg.type === 'image') {
      return (
        <img src={msg.content} alt={msg.fileName}
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setZoomedMedia({ type: 'image', src: msg.content || '' })} />
      );
    } else if (msg.type === 'video') {
      return (
        <video src={msg.content} controls className="max-w-full rounded-lg cursor-pointer"
          onClick={() => setZoomedMedia({ type: 'video', src: msg.content || '' })} />
      );
    }
    return <p className="text-sm">{msg.text || msg.message}</p>;
  };

  // ── Shared message list renderer ──
  const MessageList = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) => (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={containerRef} style={{ scrollBehavior: 'auto' }}>
      {isLoadingMessages && isInitialLoad ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500 text-sm">Start the conversation!</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`mb-3 flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${
                msg.sender === "client" ? "bg-primaryGreen text-white" : "bg-white border border-gray-200"
              }`}
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
      {isBusinessTyping && (
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
  );

  // ── Shared input bar renderer ──
  const InputBar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`bg-white border-t border-gray-200 ${mobile ? 'px-4 py-3' : 'p-4'}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 text-gray-500 ${mobile ? '' : 'hover:bg-gray-100 rounded-full transition-colors'}`}
        >
          {IoImageOutline({ size: mobile ? 24 : 20 })}
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
          onKeyPress={handleKeyPress}
          placeholder="Message"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
        />
        {/* ── Send button always visible on both mobile and desktop ── */}
        <button
          onClick={handleSendMessage}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            mobile
              ? 'bg-primaryGreen text-white hover:bg-hoverGreen'
              : 'bg-primaryGreen text-white hover:bg-hoverGreen'
          }`}
        >
          {IoSend({ size: mobile ? 20 : 20 })}
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
            {zoomedMedia.type === 'image' ? (
              <img src={zoomedMedia.src} alt="Zoomed" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
            ) : (
              <video src={zoomedMedia.src} controls className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} autoPlay />
            )}
          </div>
        </div>
      )}

      {/* ==================== DESKTOP ==================== */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-white p-3 flex items-center justify-between border-b border-gray-200">
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
              <div className="h-96">
                <WelcomeForm
                  userName={userName} setUserName={setUserName}
                  userEmail={userEmail} setUserEmail={setUserEmail}
                  onSubmit={handleWelcomeSubmit} onSwitchToReturning={switchToReturningForm}
                  isLoading={isSubmittingWelcome} emailPrefilled={emailPrefilled}
                />
              </div>
            ) : showReturningForm ? (
              <div className="h-96">
                <ReturningUserForm
                  userEmail={returningEmail} setUserEmail={setReturningEmail}
                  onSubmit={handleReturningSubmit} onSwitchToNew={switchToWelcomeForm}
                  error={returningError} isLoading={isLoadingReturning}
                />
              </div>
            ) : (
              <>
                <div className="h-96 overflow-y-auto p-4 bg-gray-50" ref={messageContainerRef} style={{ scrollBehavior: 'auto' }}>
                  {isLoadingMessages && isInitialLoad ? (
                    <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading messages...</p></div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">Start the conversation!</p></div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`mb-3 flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${msg.sender === "client" ? "bg-primaryGreen text-white" : "bg-white border border-gray-200"}`} onClick={() => handleMessageClick(msg.id)}>
                          {renderMessage(msg)}
                        </div>
                        {clickedMessageId === msg.id && msg.createdAt && (
                          <span className={`text-xs mt-1 px-1 ${msg.sender === "client" ? "text-gray-600" : "text-gray-500"}`}>{formatTimestamp(msg.createdAt)}</span>
                        )}
                      </div>
                    ))
                  )}
                  {isBusinessTyping && (
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
                <InputBar mobile={false} />
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
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(false)} className="p-2 -ml-2">{FaChevronLeft({ size: 20 })}</button>
              {businessLogo
                ? <img src={businessLogo} alt={businessName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                : <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />}
              <span className="font-semibold md:text-base text-sm">{businessName}</span>
            </div>
          </div>

          {showWelcomeForm ? (
            <div className="flex-1">
              <WelcomeForm
                userName={userName} setUserName={setUserName}
                userEmail={userEmail} setUserEmail={setUserEmail}
                onSubmit={handleWelcomeSubmit} onSwitchToReturning={switchToReturningForm}
                isLoading={isSubmittingWelcome} emailPrefilled={emailPrefilled}
              />
            </div>
          ) : showReturningForm ? (
            <div className="flex-1">
              <ReturningUserForm
                userEmail={returningEmail} setUserEmail={setReturningEmail}
                onSubmit={handleReturningSubmit} onSwitchToNew={switchToWelcomeForm}
                error={returningError} isLoading={isLoadingReturning}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={mobileMessageContainerRef} style={{ scrollBehavior: 'auto' }}>
                {isLoadingMessages && isInitialLoad ? (
                  <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading messages...</p></div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full"><p className="text-gray-500 text-sm">Start the conversation!</p></div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${msg.sender === "client" ? "bg-primaryGreen text-white" : "bg-white border border-gray-200"}`} onClick={() => handleMessageClick(msg.id)}>
                        {renderMessage(msg)}
                      </div>
                      {clickedMessageId === msg.id && msg.createdAt && (
                        <span className={`text-xs mt-1 px-1 ${msg.sender === "client" ? "text-gray-600" : "text-gray-500"}`}>{formatTimestamp(msg.createdAt)}</span>
                      )}
                    </div>
                  ))
                )}
                {isBusinessTyping && (
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
              <InputBar mobile={true} />
            </>
          )}
        </div>
      )}
    </>
  );
}