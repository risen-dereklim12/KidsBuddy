import React from 'react';

interface SuggestionCardsProps {
  suggestions: string[];
  onSelectSuggestion: (text: string) => void;
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({ suggestions, onSelectSuggestion }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="suggestion-container">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          className="suggestion-card"
          onClick={() => onSelectSuggestion(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
