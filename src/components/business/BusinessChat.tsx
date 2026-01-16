import React, { useState, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoClose, IoSend, IoImageOutline, IoSearch } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6';

export default function BusinessChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Sample client data
  const [clients] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@gmail.com",
      lastMessage: "Thanks for the update!",
      time: "10:30 AM",
      unread: 2,
      avatar: "JD"
    },
    {
      id: 2,
      name: "Sarah Smith",
      email: "sarah.smith@gmail.com",
      lastMessage: "When can we schedule a meeting?",
      time: "Yesterday",
      unread: 0,
      avatar: "SS"
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.j@gmail.com",
      lastMessage: "Perfect, see you then!",
      time: "Monday",
      unread: 1,
      avatar: "MJ"
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@gmail.com",
      lastMessage: "I have a question about the invoice",
      time: "2 days ago",
      unread: 0,
      avatar: "ED"
    }
  ]);

  // Sample messages for each client
  const [chatMessages, setChatMessages] = useState({
    1: [
      { id: 1, sender: "client", text: "Hi, I need help with my order", time: "10:15 AM" },
      { id: 2, sender: "business", text: "Hello! I'd be happy to help. What's your order number?", time: "10:20 AM" },
      { id: 3, sender: "client", text: "Thanks for the update!", time: "10:30 AM" }
    ],
    2: [
      { id: 1, sender: "client", text: "When can we schedule a meeting?", time: "Yesterday" }
    ],
    3: [
      { id: 1, sender: "business", text: "How about tomorrow at 2pm?", time: "Monday" },
      { id: 2, sender: "client", text: "Perfect, see you then!", time: "Monday" }
    ],
    4: [
      { id: 1, sender: "client", text: "I have a question about the invoice", time: "2 days ago" }
    ]
  });

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  const handleSendMessage = () => {
    if (message.trim() && activeChat) {
      const newMessage = {
        id: (chatMessages[activeChat]?.length || 0) + 1,
        sender: "business",
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages({
        ...chatMessages,
        [activeChat]: [...(chatMessages[activeChat] || []), newMessage]
      });
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openClientChat = (clientId) => {
    setActiveChat(clientId);
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClient = clients.find(c => c.id === activeChat);
  const currentMessages = chatMessages[activeChat] || [];

  return (
    <>
      {/* DESKTOP CHAT WIDGET */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200">
            {!activeChat ? (
              // Client List View
              <>
                <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
                  <h2 className="font-medium text-lg">Messages</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                      {FaAngleDown({ size: 20, className: "text-gray-600" })}
                  </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    {IoSearch({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 })}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages"
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                    />
                  </div>
                </div>

                {/* Client List */}
                <div className="h-96 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => openClientChat(client.id)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                          {client.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                            <span className="text-xs text-gray-500 ml-2">{client.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{client.email}</p>
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
            ) : (
              // Individual Chat View
              <>
                <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={closeChat}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                      {FaChevronLeft({ size: 18, className: "text-gray-600" })}
                    </button>
                    <div className="w-10 h-10 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                      {activeClient?.avatar}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{activeClient?.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{activeClient?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-3 flex ${msg.sender === "business" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          msg.sender === "business"
                            ? "bg-primaryGreen text-white"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-2">
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

        {/* Chat Button */}
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
          {!activeChat ? (
            // Mobile Client List
            <>
              <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg">Messages</h2>
                  <button onClick={() => setIsOpen(false)} className="p-2">
                    {IoClose({ size: 24 })}
                  </button>
                </div>
                <div className="relative">
                  {IoSearch({ className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 18 })}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages"
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => openClientChat(client.id)}
                    className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold text-lg flex-shrink-0">
                        {client.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base truncate">{client.name}</h3>
                          <span className="text-xs text-gray-500 ml-2">{client.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
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
          ) : (
            // Mobile Individual Chat
            <>
              <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
                <div className="flex items-center gap-3">
                  <button onClick={closeChat} className="p-2 -ml-2">
                    {FaChevronLeft({ size: 20 })}
                  </button>
                  <div className="w-10 h-10 bg-primaryGreen text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                    {activeClient?.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{activeClient?.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{activeClient?.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.sender === "business" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        msg.sender === "business"
                          ? "bg-primaryGreen text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500">
                    {IoImageOutline ({size:24})}
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