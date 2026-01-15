import React, { useState, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoClose, IoSend, IoImageOutline } from "react-icons/io5";
import { FaAngleDown, FaChevronLeft } from 'react-icons/fa6'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "business",
      text: "Lorem ipsum dolor sit amet.",
      time: "10:30 AM"
    }
  ]);

  // Listen for open chat event from mobile header
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: "user",
          text: message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* DESKTOP CHAT WIDGET */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl w-80 mb-4 overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
                <span className="font-semibold text-sm">Business Name</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                {FaAngleDown({ size: 20, className: "text-gray-600" })}
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-3 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.sender === "user"
                        ? "bg-primaryGreen text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
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
              <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" />
              <span className="font-semibold md:text-base text-sm">Business Name</span>
            </div>
          </div>

          {/* Mobile Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-primaryGreen text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Input Area */}
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500">
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
        </div>
      )}
    </>
  );
}