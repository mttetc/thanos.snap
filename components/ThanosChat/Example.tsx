import React, { useEffect } from 'react';
import { ThanosChat } from './ThanosChat';
import type { Message } from './types';

// This component demonstrates how to use the ThanosChat component
export function ThanosChatExample() {
  // Ensure the Thanos library is loaded
  useEffect(() => {
    // Check if we need to load the scripts
    if (typeof window !== 'undefined' && !window.Thanos) {
      // Load html2canvas
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
      html2canvasScript.async = true;
      
      // Load Motion (Framer Motion)
      const motionScript = document.createElement('script');
      motionScript.src = 'https://cdn.jsdelivr.net/npm/motion@10.17.0/dist/motion.min.js';
      motionScript.async = true;
      
      // Load the Thanos library
      const thanosScript = document.createElement('script');
      thanosScript.src = '/dist/index.global.js'; // Adjust path as needed
      thanosScript.async = true;
      
      // Append scripts to document
      document.head.appendChild(html2canvasScript);
      document.head.appendChild(motionScript);
      document.head.appendChild(thanosScript);
      
      // Clean up on unmount
      return () => {
        document.head.removeChild(html2canvasScript);
        document.head.removeChild(motionScript);
        document.head.removeChild(thanosScript);
      };
    }
  }, []);
  
  // Custom initial messages
  const customMessages: Message[] = [
    { text: "Welcome to the Thanos Chat React Component!", type: "received" },
    { text: "This is a React version of the Thanos snap effect demo.", type: "sent" },
    { text: "Try sending a message or deleting one to see the effect!", type: "received" }
  ];
  
  // Custom message delete handler
  const handleMessageDelete = (messageId: string) => {
    console.log(`Message deleted: ${messageId}`);
  };
  
  // Custom message send handler
  const handleMessageSend = (text: string) => {
    console.log(`Message sent: ${text}`);
  };
  
  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f5f5f5'
    }}>
      <ThanosChat 
        initialMessages={customMessages}
        avatarText="R"
        contactName="React Thanos"
        onMessageDelete={handleMessageDelete}
        onMessageSend={handleMessageSend}
      />
    </div>
  );
} 