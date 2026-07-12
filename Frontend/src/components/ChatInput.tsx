import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy') => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStateChange }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const onSendMessageRef = useRef(onSendMessage);
  const onStateChangeRef = useRef(onStateChange);
  const transcriptRef = useRef('');

  // Keep references to props updated to avoid stale closures
  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        onStateChangeRef.current('listening');
      };

      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setInputText(speechToText);
        transcriptRef.current = speechToText;
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        onStateChangeRef.current('idle');

        if (event.error === 'not-allowed') {
          setMicError("Microphone access is blocked! Please enable microphone permission in your browser address bar to talk to Buddy. 🦖🎙️");
        } else if (event.error === 'no-speech') {
          // Silent timeout or no speech detected, no need for banner, just stop
        } else if (event.error === 'audio-capture') {
          setMicError("We couldn't find your microphone. Please make sure it's plugged in and working! 🎤");
        } else if (event.error === 'network') {
          setMicError("Network error: The browser's speech recognition server is unreachable. (If using Brave, please turn on 'Google Services for Web Speech API' in brave://settings/privacy) 🌐❌");
        } else {
          setMicError(`Voice typing error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        onStateChangeRef.current('idle');

        const finalSpeech = transcriptRef.current;
        if (finalSpeech.trim()) {
          onSendMessageRef.current(finalSpeech.trim());
          setInputText('');
          transcriptRef.current = '';
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Oops! Your browser doesn't support voice typing. Try using Google Chrome! 🎤");
      return;
    }

    setMicError(null);

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        // Cancel active text-to-speech so it doesn't interfere with voice recording
        window.speechSynthesis.cancel();
        transcriptRef.current = '';
        
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {micError && (
        <div className="mic-error-banner">
          <span>{micError}</span>
          <button onClick={() => setMicError(null)} className="error-close-btn">×</button>
        </div>
      )}
      <div className="input-area">
        <input
          type="text"
          className="text-input"
          placeholder={isRecording ? "Listening to you... Speak now!" : "Type a message to Buddy..."}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setMicError(null);
          }}
          onKeyDown={handleKeyPress}
          disabled={isRecording}
        />

        <button
          type="button"
          className={`mic-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title="Talk to Buddy"
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Send</span>
            <Send size={18} />
          </div>
        </button>
      </div>
    </div>
  );
};
