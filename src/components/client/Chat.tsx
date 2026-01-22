import React, { useState, useEffect, useRef } from "react";
import { IoChatbubbleEllipsesOutline, IoClose, IoSend, IoImageOutline } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6';
import axios from 'axios';

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

// Move WelcomeForm OUTSIDE the main component
const WelcomeForm = ({ 
  userName, 
  setUserName, 
  userEmail, 
  setUserEmail, 
  onSubmit 
}: {
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <div className="p-6 bg-gray-50 h-full flex flex-col justify-center">
    <div className="mb-6 text-center">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        👋 Welcome!
      </h3>
      <p className="text-sm text-gray-600">
        We'd love to chat with you. Let's get started!
      </p>
    </div>
    
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What's your name?
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          And your email?
        </label>
        <input
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="your@email.com"
          className="text-sm w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen"
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full btn-primary"
      >
        Start Chatting 💬
      </button>
    </form>
    
    <p className="text-xs text-gray-500 text-center mt-4">
      We'll save your conversation so you can pick up where you left off.
    </p>
  </div>
);

export default function ChatWidget({ 
  businessSlug, 
  apiBaseUrl = 'http://localhost:5000/api' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcomeForm, setShowWelcomeForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [businessName, setBusinessName] = useState("Business Name");
  const [businessLogo, setBusinessLogo] = useState("");
  const [zoomedMedia, setZoomedMedia] = useState<{ type: 'image' | 'video', src: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user info exists and load messages
  useEffect(() => {
    const storedName = localStorage.getItem(`chat_${businessSlug}_name`);
    const storedEmail = localStorage.getItem(`chat_${businessSlug}_email`);

    // Fetch business details
    fetchBusinessDetails();

    if (storedName && storedEmail) {
      setUserName(storedName);
      setUserEmail(storedEmail);
      loadMessages(storedEmail);
    } else {
      setShowWelcomeForm(true);
    }
  }, [businessSlug]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for open chat event from mobile header
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  // Fetch business details
  const fetchBusinessDetails = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/business/${businessSlug}`);
      
      const business = response.data.business;
      if (business) {
        setBusinessName(business.businessName || "Business Name");
        setBusinessLogo(business.logo || "");
      } else {
        console.error('No business data found in response');
        setBusinessName("Business Name");
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
      setBusinessName("Business Name");
    }
  };

  // Load messages from backend
  const loadMessages = async (email: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await axios.get(
        `${apiBaseUrl}/chat/messages/client/${businessSlug}/${email}`
      );
      
      const formattedMessages = response.data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.message,
        time: new Date(msg.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: msg.messageType || null,
        content: msg.fileContent,
        fileName: msg.fileName
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle welcome form submission
  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userName.trim() && userEmail.trim()) {
      // Save to localStorage
      localStorage.setItem(`chat_${businessSlug}_name`, userName);
      localStorage.setItem(`chat_${businessSlug}_email`, userEmail);
      
      // Send initial greeting message
      try {
        await axios.post(`${apiBaseUrl}/chat/send-client`, {
          businessSlug,
          clientEmail: userEmail,
          clientName: userName,
          message: `Hi! I'm ${userName}. I'd like to get in touch.`
        });
        
        // Load messages
        await loadMessages(userEmail);
      } catch (error) {
        console.error('Error sending initial message:', error);
      }
      
      setShowWelcomeForm(false);
    }
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
            try {
              // Send to backend
              await axios.post(`${apiBaseUrl}/chat/send-client`, {
                businessSlug,
                clientEmail: userEmail,
                clientName: userName,
                message: file.name,
                messageType: fileType,
                fileContent: result
              });
              
              // Reload messages
              await loadMessages(userEmail);
            } catch (error) {
              console.error('Error sending file:', error);
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
      try {
        await axios.post(`${apiBaseUrl}/chat/send-client`, {
          businessSlug,
          clientEmail: userEmail,
          clientName: userName,
          message: message.trim()
        });
        
        setMessage("");
        await loadMessages(userEmail);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (msg: Message) => {
    if (msg.type === 'image') {
      return (
        <img 
          src={msg.content} 
          alt={msg.fileName}
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setZoomedMedia({ type: 'image', src: msg.content || '' })}
        />
      );
    } else if (msg.type === 'video') {
      return (
        <video 
          src={msg.content} 
          controls
          className="max-w-full rounded-lg cursor-pointer"
          onClick={() => setZoomedMedia({ type: 'video', src: msg.content || '' })}
        />
      );
    }
    return <p className="text-sm">{msg.text || msg.message}</p>;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* MEDIA ZOOM MODAL */}
      {zoomedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
          onClick={() => setZoomedMedia(null)}
        >
          <button
            onClick={() => setZoomedMedia(null)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            ×
          </button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {zoomedMedia.type === 'image' ? (
              <img 
                src={zoomedMedia.src} 
                alt="Zoomed"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video 
                src={zoomedMedia.src} 
                controls
                className="max-w-full max-h-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
                autoPlay
              />
            )}
          </div>
        </div>
      )}

      {/* DESKTOP CHAT WIDGET */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                {businessLogo ? (
                  <img 
                    src={businessLogo} 
                    alt={businessName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                )}
                <span className="font-semibold text-sm">{businessName}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                {FaAngleDown({ size: 20, className: "text-gray-600" })}
              </button>
            </div>

            {/* Chat Content */}
            {showWelcomeForm ? (
              <div className="h-96">
                <WelcomeForm 
                  userName={userName}
                  setUserName={setUserName}
                  userEmail={userEmail}
                  setUserEmail={setUserEmail}
                  onSubmit={handleWelcomeSubmit}
                />
              </div>
            ) : (
              <>
                {/* Chat Messages Area */}
                <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500 text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-3 flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            msg.sender === "client"
                              ? "bg-primaryGreen text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          {renderMessage(msg)}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {IoImageOutline({ size: 20 })}
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Message"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-2 bg-primaryGreen text-white rounded-full hover:bg-hoverGreen transition-colors"
                    >
                      {IoSend({ size: 20 })}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Chat Button - Only show when closed */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primaryGreen text-white p-4 rounded-full shadow-lg hover:bg-hoverGreen transition-colors"
          >
            {IoChatbubbleEllipsesOutline({ size: 25 })}
          </button>
        )}
      </div>

      {/* MOBILE FULL-SCREEN CHAT */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* Mobile Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(false)} className="p-2 -ml-2">
                {FaChevronLeft({ size: 20 })}
              </button>
              {businessLogo ? (
                <img 
                  src={businessLogo} 
                  alt={businessName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
              )}
              <span className="font-semibold md:text-base text-sm">{businessName}</span>
            </div>
          </div>

          {/* Mobile Content */}
          {showWelcomeForm ? (
            <div className="flex-1">
              <WelcomeForm 
                userName={userName}
                setUserName={setUserName}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
                onSubmit={handleWelcomeSubmit}
              />
            </div>
          ) : (
            <>
              {/* Mobile Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500 text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender === "client"
                            ? "bg-primaryGreen text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        {renderMessage(msg)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mobile Input Area */}
              <div className="bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500"
                  >
                      {IoImageOutline({ size: 24 })}
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 text-primaryGreen"
                  >
                      {IoSend({ size: 24 })}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}