import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface StarRewardsProps {
  stars: number;
}

interface FloatingStar {
  id: number;
  xOffset: string;
  yOffset: string;
}

export const StarRewards: React.FC<StarRewardsProps> = ({ stars }) => {
  const [activeStars, setActiveStars] = useState(stars);
  const [floatingStars, setFloatingStars] = useState<FloatingStar[]>([]);

  useEffect(() => {
    if (stars > activeStars) {
      // Trigger a star celebration!
      const newFloating: FloatingStar[] = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + i,
        xOffset: `${(Math.random() * 300 - 150)}px`,
        yOffset: `${(Math.random() * -300 - 50)}px`,
      }));

      setFloatingStars(newFloating);
      setActiveStars(stars);

      // Clean up after animation finishes (1.8s)
      const timer = setTimeout(() => {
        setFloatingStars([]);
      }, 1800);

      return () => clearTimeout(timer);
    } else {
      setActiveStars(stars);
    }
  }, [stars, activeStars]);

  // Max 5 stars
  const totalStars = 5;

  return (
    <div className="star-rewards-container">
      <div className="stars-header">Stars Earned ⭐</div>
      <div className="stars-list">
        {Array.from({ length: totalStars }).map((_, idx) => {
          const isFilled = idx < activeStars;
          return (
            <Star
              key={idx}
              className={`star-icon ${isFilled ? 'filled' : ''}`}
              size={24}
              fill={isFilled ? '#ffca28' : 'none'}
            />
          );
        })}
      </div>

      {/* Floating stars celebration animation overlay */}
      {floatingStars.length > 0 && (
        <div className="celebration-overlay">
          {floatingStars.map((star) => (
            <span
              key={star.id}
              className="celebration-star"
              style={{
                '--x-offset': star.xOffset,
                '--y-offset': star.yOffset,
              } as React.CSSProperties}
            >
              ⭐
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
export default StarRewards;
