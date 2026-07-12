import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface ParentGateProps {
  onClose: () => void;
  autoSpeak: boolean;
  onChangeAutoSpeak: (val: boolean) => void;
  voiceSpeed: number;
  onChangeVoiceSpeed: (val: number) => void;
  voicePitch: number;
  onChangeVoicePitch: (val: number) => void;
  customBlockedWords: string;
  onChangeCustomBlockedWords: (val: string) => void;
  onResetChat: () => void;
  onResetStars: () => void;
}

export const ParentGate: React.FC<ParentGateProps> = ({
  onClose,
  autoSpeak,
  onChangeAutoSpeak,
  voiceSpeed,
  onChangeVoiceSpeed,
  voicePitch,
  onChangeVoicePitch,
  customBlockedWords,
  onChangeCustomBlockedWords,
  onResetChat,
  onResetStars,
}) => {
  const [passed, setPassed] = useState(false);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generate a random math equation to gate access
  useEffect(() => {
    setNum1(Math.floor(Math.random() * 8) + 6); // 6 to 13
    setNum2(Math.floor(Math.random() * 8) + 6); // 6 to 13
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 + num2;
    if (parseInt(userAnswer.trim(), 10) === correctAnswer) {
      setPassed(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Oops! That is not correct. Try again! 🤔');
      setUserAnswer('');
    }
  };

  return (
    <div className="parent-gate-overlay">
      <div className="parent-gate-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
          >
            <X size={24} />
          </button>
        </div>

        {!passed ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--primary-color)' }}>
              <ShieldCheck size={48} />
            </div>
            <h2>Parents Only!</h2>
            <p>Please solve this math question to access the settings dashboard.</p>

            <form onSubmit={handleVerify}>
              <div className="math-question">
                What is {num1} + {num2}?
              </div>
              <input
                type="number"
                className="math-input"
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                autoFocus
              />
              {errorMsg && (
                <div style={{ color: '#d32f2f', fontWeight: '700', marginBottom: '16px' }}>
                  {errorMsg}
                </div>
              )}
              <div className="parent-gate-buttons">
                <button type="submit" className="parent-btn-submit">
                  Verify & Open
                </button>
                <button type="button" className="parent-btn-cancel" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <h2>Parents Dashboard 🛠️</h2>
            <p style={{ marginBottom: '20px' }}>Customize Buddy's voice characteristics and safety settings.</p>

            <div className="parent-dashboard">
              <div className="dashboard-row">
                <label>Auto Read Messages</label>
                <select
                  className="dashboard-select"
                  value={autoSpeak ? 'yes' : 'no'}
                  onChange={(e) => onChangeAutoSpeak(e.target.value === 'yes')}
                >
                  <option value="yes">Yes, speak responses automatically 🔊</option>
                  <option value="no">No, speak only when clicking speaker 🔇</option>
                </select>
              </div>

              <div className="dashboard-row">
                <label>Voice Speed (Rate: {voiceSpeed}x)</label>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => onChangeVoiceSpeed(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--primary-color)' }}
                />
              </div>

              <div className="dashboard-row">
                <label>Voice Tone (Pitch: {voicePitch}x)</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.7"
                  step="0.1"
                  value={voicePitch}
                  onChange={(e) => onChangeVoicePitch(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--primary-color)' }}
                />
              </div>

              <div className="dashboard-row">
                <label>Custom Blocked Words (Comma separated)</label>
                <textarea
                  className="dashboard-textarea"
                  rows={2}
                  value={customBlockedWords}
                  onChange={(e) => onChangeCustomBlockedWords(e.target.value)}
                  placeholder="e.g. homework, tablet, video games"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="parent-btn-cancel"
                  style={{ flex: 1, backgroundColor: '#ffebee', color: '#c62828', fontSize: '15px' }}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete all messages?")) {
                      onResetChat();
                    }
                  }}
                >
                  Reset Chat History
                </button>
                <button
                  type="button"
                  className="parent-btn-cancel"
                  style={{ flex: 1, backgroundColor: '#fff8e1', color: '#f57f17', fontSize: '15px' }}
                  onClick={() => {
                    onResetStars();
                  }}
                >
                  Reset Star Meter
                </button>
              </div>

              <button
                type="button"
                className="parent-btn-submit"
                style={{ marginTop: '16px' }}
                onClick={onClose}
              >
                Close Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
