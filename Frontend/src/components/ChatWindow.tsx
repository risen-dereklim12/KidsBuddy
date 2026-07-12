import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy') => void;
  autoSpeak: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onStateChange, autoSpeak }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageId = useRef<string>('');

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Text-to-Speech
  const speakText = (text: string) => {
    // Stop any current voice speech
    window.speechSynthesis.cancel();

    // Clean up text from emoji codes if necessary (browser usually handles emojis fine or skips them)
    const cleanedText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.pitch = 1.35; // Friendly, slightly higher child voice pitch
    utterance.rate = 0.9;  // Slightly slower rate for clarity

    // Select friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Hazel'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      onStateChange('speaking');
    };

    utterance.onend = () => {
      onStateChange('idle');
    };

    utterance.onerror = () => {
      onStateChange('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak new bot messages if enabled
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'bot' && autoSpeak && lastMessage.id !== lastSpokenMessageId.current) {
        lastSpokenMessageId.current = lastMessage.id;
        // Wait briefly for mascot state transition to resolve
        setTimeout(() => {
          speakText(lastMessage.text);
        }, 300);
      }
    }
  }, [messages, autoSpeak]);

  // Handle manual speak button click
  const handleManualSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    speakText(text);
  };

  return (
    <div className="chat-window">
      <div className="message-list">
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            gap: '12px',
            padding: '24px'
          }}>
            <span style={{ fontSize: '48px' }}>🦖✨</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800' }}>Say Hello to Buddy!</h3>
            <p style={{ fontSize: '16px', fontWeight: '600', maxWidth: '280px' }}>
              Ask Buddy a question, request a joke, or press the mic to talk!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              <div className="message-bubble">
                {msg.text}
                {msg.sender === 'bot' && (
                  <button
                    onClick={(e) => handleManualSpeak(e, msg.text)}
                    className="bubble-speaker"
                    title="Read Aloud"
                    style={{ background: 'none', border: 'none', padding: '0 4px', cursor: 'pointer' }}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
