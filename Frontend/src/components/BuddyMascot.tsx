import React, { useEffect, useState } from 'react';

interface BuddyMascotProps {
  expression: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy';
}

export const BuddyMascot: React.FC<BuddyMascotProps> = ({ expression }) => {
  const [mouthOpen, setMouthOpen] = useState(false);

  // Animate mouth opening and closing when speaking
  useEffect(() => {
    let interval: any;
    if (expression === 'speaking') {
      interval = setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 200);
    } else {
      setMouthOpen(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expression]);

  // Return the speech status label
  const getStatusText = () => {
    switch (expression) {
      case 'listening': return 'I\'m listening! 👂';
      case 'thinking': return 'Thinking... 💡';
      case 'speaking': return 'Talking! 💬';
      case 'happy': return 'Yay! Happy! 🎉';
      default: return 'Hello! 😊';
    }
  };

  // Eyes rendering depending on state
  const renderEyes = () => {
    switch (expression) {
      case 'happy':
        // Closed smiley arcs
        return (
          <>
            <path d="M 38 45 Q 45 35 52 45" stroke="#1b5e20" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 68 45 Q 75 35 82 45" stroke="#1b5e20" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        // Concentrating eyes
        return (
          <>
            <ellipse cx="43" cy="45" rx="5" ry="3" fill="#1b5e20" />
            <ellipse cx="77" cy="45" rx="5" ry="3" fill="#1b5e20" />
          </>
        );
      case 'listening':
        // Big open curious eyes
        return (
          <>
            <ellipse cx="45" cy="43" rx="8" ry="9" fill="#1b5e20" />
            <circle cx="43" cy="40" r="3" fill="white" />
            <ellipse cx="75" cy="43" rx="8" ry="9" fill="#1b5e20" />
            <circle cx="73" cy="40" r="3" fill="white" />
          </>
        );
      default: // idle or speaking
        return (
          <>
            <ellipse cx="45" cy="44" rx="7" ry="7" fill="#1b5e20" />
            <circle cx="43" cy="41" r="2.5" fill="white" />
            <circle cx="47" cy="45" r="1" fill="white" />
            <ellipse cx="75" cy="44" rx="7" ry="7" fill="#1b5e20" />
            <circle cx="73" cy="41" r="2.5" fill="white" />
            <circle cx="77" cy="45" r="1" fill="white" />
          </>
        );
    }
  };

  // Mouth rendering depending on state
  const renderMouth = () => {
    if (expression === 'speaking') {
      return mouthOpen ? (
        // Wide open speech bubble mouth
        <ellipse cx="60" cy="62" rx="10" ry="8" fill="#e64a19" />
      ) : (
        // Closed smiley line mouth
        <path d="M 48 58 Q 60 66 72 58" stroke="#1b5e20" strokeWidth="4" fill="none" strokeLinecap="round" />
      );
    }

    switch (expression) {
      case 'happy':
        // Large laughing smile
        return (
          <path d="M 46 56 Q 60 72 74 56 Z" fill="#e64a19" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
        );
      case 'thinking':
        // Slightly flat, inquisitive mouth
        return (
          <path d="M 52 60 Q 60 58 68 60" stroke="#1b5e20" strokeWidth="4" fill="none" strokeLinecap="round" />
        );
      case 'listening':
        // Small "oh" shape mouth
        return (
          <circle cx="60" cy="60" r="6" fill="#e64a19" stroke="#1b5e20" strokeWidth="3" />
        );
      default: // idle
        return (
          <path d="M 48 58 Q 60 68 72 58" stroke="#1b5e20" strokeWidth="4" fill="none" strokeLinecap="round" />
        );
    }
  };

  return (
    <div className="mascot-container">
      <svg
        className={`mascot-svg ${expression}`}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background shadows for dino */}
        <ellipse cx="60" cy="112" rx="35" ry="6" fill="rgba(0,0,0,0.12)" />

        {/* Tail */}
        <path
          d="M 25 85 C 10 90 5 70 8 60 C 12 50 20 60 28 72 Z"
          fill="var(--mascot-color)"
          stroke="#1b5e20"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Tail Spike */}
        <path d="M 10 65 L 14 62 L 18 69 Z" fill="#fbc02d" stroke="#1b5e20" strokeWidth="1" />

        {/* Dino Body */}
        <path
          d="M 40 105 C 30 100 25 80 32 60 C 35 48 45 42 50 30 C 55 18 70 12 85 18 C 95 24 98 38 95 48 C 92 58 88 68 88 80 C 88 95 80 105 70 106 Z"
          fill="var(--mascot-color)"
          stroke="#1b5e20"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Back Spikes */}
        <path d="M 85 13 L 93 6 L 91 18 Z" fill="#fbc02d" stroke="#1b5e20" strokeWidth="2.5" />
        <path d="M 95 30 L 103 26 L 97 36 Z" fill="#fbc02d" stroke="#1b5e20" strokeWidth="2.5" />
        <path d="M 94 50 L 102 48 L 92 56 Z" fill="#fbc02d" stroke="#1b5e20" strokeWidth="2.5" />
        <path d="M 88 72 L 95 72 L 87 79 Z" fill="#fbc02d" stroke="#1b5e20" strokeWidth="2.5" />

        {/* Dino Cheerful Tummy */}
        <path
          d="M 45 85 C 45 65 52 50 68 50 C 78 50 82 65 82 85 C 82 98 75 105 60 105 C 48 105 45 98 45 85 Z"
          fill="#fff9c4"
        />

        {/* Dino Cute Face Details */}
        {renderEyes()}
        {renderMouth()}

        {/* Rosy Pink Cheeks */}
        {(expression === 'happy' || expression === 'idle' || expression === 'speaking') && (
          <>
            <circle cx="33" cy="52" r="5" fill="#f8bbd0" opacity="0.8" />
            <circle cx="87" cy="52" r="5" fill="#f8bbd0" opacity="0.8" />
          </>
        )}

        {/* Little Dino Horn */}
        <path
          d="M 60 18 Q 63 8 68 15 Z"
          fill="#fbc02d"
          stroke="#1b5e20"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Hands */}
        <path
          d="M 42 75 Q 32 75 35 70"
          stroke="#1b5e20"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 78 75 Q 88 75 85 70"
          stroke="#1b5e20"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />

        {/* Feet */}
        <ellipse cx="42" cy="107" rx="9" ry="5" fill="var(--mascot-color)" stroke="#1b5e20" strokeWidth="3" />
        <ellipse cx="78" cy="107" rx="9" ry="5" fill="var(--mascot-color)" stroke="#1b5e20" strokeWidth="3" />
      </svg>
      <div className="mascot-speech-bubble">{getStatusText()}</div>
    </div>
  );
};
