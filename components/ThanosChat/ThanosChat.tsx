import React, { useState, useRef, useEffect } from 'react';
import { Message, ThanosMessage } from './types';
import './ThanosChat.css';

interface ThanosChatProps {
  initialMessages?: Message[];
  avatarText?: string;
  contactName?: string;
  onMessageDelete?: (messageId: string) => void;
  onMessageSend?: (text: string) => void;
}

export function ThanosChat({
  initialMessages = [],
  avatarText = 'T',
  contactName = 'Thanos',
  onMessageDelete,
  onMessageSend
}: ThanosChatProps) {
  const [messages, setMessages] = useState<ThanosMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageCount = useRef(0);

  // Initialize with default messages if none provided
  useEffect(() => {
    if (initialMessages.length === 0) {
      const defaultMessages: Message[] = [
        { text: "Hey there! How's it going?", type: "received" },
        { text: "I'm doing great! Just working on this cool animation effect.", type: "sent" },
        { text: "Oh nice! What kind of animation?", type: "received" },
        { text: "It's a disintegration effect, like when Thanos snaps his fingers.", type: "sent" },
        { text: "That sounds awesome! Can I see it in action?", type: "received" },
        { text: "Sure! Just click the X on any message to delete it with the snap effect.", type: "sent" }
      ];
      
      addInitialMessages(defaultMessages);
    } else {
      addInitialMessages(initialMessages);
    }
  }, []);

  // Add initial messages with a delay
  const addInitialMessages = (messagesToAdd: Message[]) => {
    let delay = 0;
    const newMessages: ThanosMessage[] = [];
    
    messagesToAdd.forEach(msg => {
      setTimeout(() => {
        const newMessage = createMessage(msg.text, msg.type);
        setMessages(prev => [...prev, newMessage]);
      }, delay);
      delay += 500;
    });
  };

  // Create a new message object
  const createMessage = (text: string, type: 'sent' | 'received'): ThanosMessage => {
    return {
      id: `message-${messageCount.current++}`,
      text,
      type,
      time: getCurrentTime()
    };
  };

  // Delete a message with the Thanos snap effect
  const deleteMessage = (messageId: string) => {
    const messageElement = document.getElementById(messageId);
    if (messageElement && typeof window !== 'undefined' && window.Thanos) {
      window.Thanos.snap(messageElement, { 
        direction: getRandomDirection(),
        angleVariation: 0.9, // Increased variation for more randomness (was 0.7)
        onComplete: () => {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          if (onMessageDelete) {
            onMessageDelete(messageId);
          }
        }
      });
    }
  };

  // Send a new message
  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage = createMessage(inputText.trim(), 'sent');
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      if (onMessageSend) {
        onMessageSend(inputText.trim());
      } else {
        // Simulate a reply after a short delay
        setTimeout(() => {
          const replies = [
            "That's interesting!",
            "Tell me more about that.",
            "Cool! 😎",
            "I see what you mean.",
            "Wow, that's impressive!",
            "Hmm, I'm not sure about that.",
            "Let's talk about something else.",
            "Have you tried clicking the X to delete messages?",
            "The snap effect is really satisfying, isn't it?"
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          const replyMessage = createMessage(randomReply, 'received');
          setMessages(prev => [...prev, replyMessage]);
        }, 1000 + Math.random() * 1000);
      }
    }
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Get a random direction for the snap effect - only using 'up' direction with random angle variation
  const getRandomDirection = (): 'up' => {
    // Always return 'up' as the base direction, the angleVariation parameter will handle the randomness
    return 'up';
  };

  // Reset the demo
  const resetDemo = () => {
    setMessages([]);
    messageCount.current = 0;
    
    if (initialMessages.length > 0) {
      addInitialMessages(initialMessages);
    } else {
      const defaultMessages: Message[] = [
        { text: "Hey there! How's it going?", type: "received" },
        { text: "I'm doing great! Just working on this cool animation effect.", type: "sent" },
        { text: "Oh nice! What kind of animation?", type: "received" },
        { text: "It's a disintegration effect, like when Thanos snaps his fingers.", type: "sent" },
        { text: "That sounds awesome! Can I see it in action?", type: "received" },
        { text: "Sure! Just click the X on any message to delete it with the snap effect.", type: "sent" }
      ];
      addInitialMessages(defaultMessages);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="thanos-chat-wrapper">
      <div className="thanos-chat-controls">
        <button className="thanos-chat-reset-btn" onClick={resetDemo}>Reset Demo</button>
      </div>

      <div className="thanos-chat-phone">
        <div className="thanos-chat-header">
          <div className="thanos-chat-avatar">{avatarText}</div>
          <h1>{contactName}</h1>
        </div>

        <div className="thanos-chat-container" ref={chatContainerRef}>
          {messages.map(message => (
            <div 
              key={message.id} 
              id={message.id} 
              className={`thanos-chat-message ${message.type}`}
            >
              <div className="thanos-chat-message-content">{message.text}</div>
              <div className="thanos-chat-message-time">{message.time}</div>
              <div 
                className="thanos-chat-delete-btn" 
                onClick={() => deleteMessage(message.id)}
              >
                ✕
              </div>
            </div>
          ))}
        </div>

        <div className="thanos-chat-footer">
          <div className="thanos-chat-message-input">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..." 
              autoComplete="off"
            />
            <button className="thanos-chat-send-btn" onClick={sendMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 