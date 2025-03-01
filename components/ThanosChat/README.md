# ThanosChat React Component

A React component that implements a chat interface with Thanos snap effect for message deletion.

## Features

- Mobile phone-like chat interface
- Send and receive messages
- Delete messages with Thanos snap effect
- Customizable avatar and contact name
- Responsive design
- Automatic replies (optional)
- Custom event handlers for message deletion and sending

## Installation

1. Copy the `ThanosChat` folder to your project's components directory.
2. Ensure you have the required dependencies:
   - React
   - The Thanos.Snap library (included in this project)
   - html2canvas
   - motion (Framer Motion)

## Usage

```tsx
import React from 'react';
import { ThanosChat } from './components/ThanosChat';
import type { Message } from './components/ThanosChat';

function App() {
  // Optional: Custom initial messages
  const initialMessages: Message[] = [
    { text: "Hello there!", type: "received" },
    { text: "Hi! How are you?", type: "sent" },
  ];
  
  // Optional: Custom event handlers
  const handleMessageDelete = (messageId: string) => {
    console.log(`Message deleted: ${messageId}`);
  };
  
  const handleMessageSend = (text: string) => {
    console.log(`Message sent: ${text}`);
    
    // You can implement custom reply logic here
    // For example, connecting to a chat API
  };
  
  return (
    <div className="app">
      <ThanosChat 
        initialMessages={initialMessages}
        avatarText="T"
        contactName="Thanos"
        onMessageDelete={handleMessageDelete}
        onMessageSend={handleMessageSend}
      />
    </div>
  );
}

export default App;
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialMessages` | `Message[]` | `[]` | Initial messages to display in the chat |
| `avatarText` | `string` | `'T'` | Text to display in the avatar circle |
| `contactName` | `string` | `'Thanos'` | Name to display in the chat header |
| `onMessageDelete` | `(messageId: string) => void` | `undefined` | Callback function when a message is deleted |
| `onMessageSend` | `(text: string) => void` | `undefined` | Callback function when a message is sent |

## Types

```ts
interface Message {
  text: string;
  type: 'sent' | 'received';
}

interface ThanosMessage extends Message {
  id: string;
  time: string;
}
```

## Dependencies

This component requires the following dependencies:

1. The Thanos.Snap library (included in this project)
2. html2canvas (for capturing elements before applying the effect)
3. motion (Framer Motion, for animations)

These dependencies are loaded dynamically in the example component, but you can also include them in your project's dependencies.

## Example

See the `Example.tsx` file for a complete example of how to use the ThanosChat component.

## License

MIT 