import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { BuddyMascot } from './components/BuddyMascot';
import { ChatWindow, Message } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SuggestionCards } from './components/SuggestionCards';
import { StarRewards } from './components/StarRewards';
import { ParentGate } from './components/ParentGate';
import { getBotResponse } from './services/mockBotEngine';

export const App: React.FC = () => {
  // Theme state: dino (default), space, unicorn
  const [theme, setTheme] = useState<'dino' | 'space' | 'unicorn'>(() => {
    return (localStorage.getItem('kidsbuddy-theme') as any) || 'dino';
  });

  // Chat message history
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('kidsbuddy-messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error('Error parsing messages:', e);
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Hello there! 🦕 I am Buddy, your friendly dinosaur! I love jokes, facts, games, and telling stories. Press the microphone below and say hello, or type a message!',
        timestamp: new Date(),
      },
    ];
  });

  // Mascot expression state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy'
  const [mascotExpression, setMascotExpression] = useState<'idle' | 'listening' | 'thinking' | 'speaking' | 'happy'>('idle');

  // Gamification: stars count (max 5)
  const [stars, setStars] = useState<number>(() => {
    return parseInt(localStorage.getItem('kidsbuddy-stars') || '0', 10);
  });

  // Message counters for rewarding stars
  const [userMsgCount, setUserMsgCount] = useState(0);

  // Suggestions row
  const [suggestions, setSuggestions] = useState<string[]>([
    'Tell me a joke! 🤪',
    'Tell me a story 📖',
    'Let\'s play a game 🎮',
    'Animal facts 🧐',
  ]);

  // Parent configuration settings
  const [showParentSettings, setShowParentSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    return localStorage.getItem('kidsbuddy-autospeak') !== 'false';
  });
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    return parseFloat(localStorage.getItem('kidsbuddy-voicespeed') || '0.9');
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    return parseFloat(localStorage.getItem('kidsbuddy-voicepitch') || '1.3');
  });
  const [customBlockedWords, setCustomBlockedWords] = useState<string>(() => {
    return localStorage.getItem('kidsbuddy-blockedwords') || '';
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('kidsbuddy-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-stars', stars.toString());
  }, [stars]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-autospeak', autoSpeak.toString());
  }, [autoSpeak]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-voicespeed', voiceSpeed.toString());
  }, [voiceSpeed]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-voicepitch', voicePitch.toString());
  }, [voicePitch]);

  useEffect(() => {
    localStorage.setItem('kidsbuddy-blockedwords', customBlockedWords);
  }, [customBlockedWords]);

  // Read clean voices Synthesis configurations override
  useEffect(() => {
    const handleVoiceConfig = () => {
      // Trigger voice configurations
    };
    window.speechSynthesis.onvoiceschanged = handleVoiceConfig;
  }, []);

  // Check if text triggers parents safety filters
  const isCustomWordBlocked = (text: string) => {
    if (!customBlockedWords.trim()) return false;
    const wordList = customBlockedWords
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);
    const lowerText = text.toLowerCase();
    return wordList.some((word) => lowerText.includes(word));
  };

  // Handle sending message
  const handleSendMessage = async (text: string) => {
    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 2. Increment message counts and reward star
    const newCount = userMsgCount + 1;
    setUserMsgCount(newCount);
    if (newCount % 3 === 0) {
      setStars((prev) => Math.min(prev + 1, 5));
      setMascotExpression('happy');
    } else {
      setMascotExpression('thinking');
    }

    // 3. Check custom parent word blocks
    if (isCustomWordBlocked(text)) {
      setTimeout(() => {
        const warningBotMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Oops! My dino ears heard a word that your parents asked me not to chat about. 🦖 Let\'s talk about stories, facts, or jokes instead! What would you like?',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, warningBotMessage]);
        setMascotExpression('speaking');
        setSuggestions(['Tell me a joke! 🤪', 'Animal facts 🧐', 'Tell me a story 📖']);
      }, 1000);
      return;
    }

    // 4. Retrieve bot response from the simulator or FastAPI backend
    try {
      const response = await getBotResponse(text, [...messages, userMessage]);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setMascotExpression(response.expression);
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (err) {
      console.error(err);
      setMascotExpression('idle');
    }
  };

  // Triggered when clicking suggestions
  const handleSelectSuggestion = (text: string) => {
    // Clean emojis from suggestion when sending if needed, but keeping it is fine.
    handleSendMessage(text);
  };

  // Reset controls
  const handleResetChat = () => {
    const defaultMsg: Message = {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello again! 🦕 I am Buddy, your friendly dinosaur! Ask me anything, play a game, or tell me a story!',
      timestamp: new Date(),
    };
    setMessages([defaultMsg]);
    setStars(0);
    setUserMsgCount(0);
    setMascotExpression('happy');
  };

  const handleResetStars = () => {
    setStars(0);
    setUserMsgCount(0);
    setMascotExpression('idle');
  };

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <nav className="nav-bar">
        <div className="logo-section">
          <span className="logo-emoji">🦖</span>
          <span style={{ letterSpacing: '-0.5px' }}>KidsBuddy</span>
        </div>

        <div className="nav-controls">
          {/* Theme selector */}
          <div className="theme-selector" title="Select a theme background">
            <button
              className={`theme-btn theme-dino ${theme === 'dino' ? 'active' : ''}`}
              onClick={() => setTheme('dino')}
            />
            <button
              className={`theme-btn theme-space ${theme === 'space' ? 'active' : ''}`}
              onClick={() => setTheme('space')}
            />
            <button
              className={`theme-btn theme-unicorn ${theme === 'unicorn' ? 'active' : ''}`}
              onClick={() => setTheme('unicorn')}
            />
          </div>

          {/* Parents access button */}
          <button
            className="icon-btn"
            onClick={() => setShowParentSettings(true)}
            title="Parents Only Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main chat window layout */}
      <div className="chat-main">
        {/* Sidebar / Mascot */}
        <section className="sidebar-section">
          <BuddyMascot expression={mascotExpression} />
          <StarRewards stars={stars} />
        </section>

        {/* Chat Stream and Inputs */}
        <section className="chat-window-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ChatWindow
            messages={messages}
            onStateChange={setMascotExpression}
            autoSpeak={autoSpeak}
          />

          <SuggestionCards
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onStateChange={setMascotExpression}
          />
        </section>
      </div>

      {/* Parent passcode verification settings modal overlay */}
      {showParentSettings && (
        <ParentGate
          onClose={() => setShowParentSettings(false)}
          autoSpeak={autoSpeak}
          onChangeAutoSpeak={setAutoSpeak}
          voiceSpeed={voiceSpeed}
          onChangeVoiceSpeed={setVoiceSpeed}
          voicePitch={voicePitch}
          onChangeVoicePitch={setVoicePitch}
          customBlockedWords={customBlockedWords}
          onChangeCustomBlockedWords={setCustomBlockedWords}
          onResetChat={handleResetChat}
          onResetStars={handleResetStars}
        />
      )}
    </div>
  );
};
export default App;
