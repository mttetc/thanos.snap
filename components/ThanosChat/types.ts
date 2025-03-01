export interface Message {
  text: string;
  type: 'sent' | 'received';
}

export interface ThanosMessage extends Message {
  id: string;
  time: string;
}

// Add Thanos types to make TypeScript happy with the window.Thanos property
declare global {
  interface Window {
    Thanos: {
      snap: (
        element: HTMLElement,
        options?: {
          duration?: number;
          direction?: 'up' | 'down' | 'left' | 'right';
          onComplete?: () => void;
          animateHeight?: boolean;
          particleDensity?: number;
          angleVariation?: number;
        }
      ) => Promise<void>;
    };
  }
} 