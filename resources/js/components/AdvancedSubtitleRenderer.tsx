import React, { useState, useEffect, useRef } from 'react';

interface WordTiming {
  word: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
  borderRadius: number;
  padding: number;
  textShadow: string;
  preset?: string;
}

interface Subtitle {
  id: string;
  index: number;
  start_time: number;
  end_time: number;
  duration: number;
  text: string;
  words: WordTiming[];
  confidence: number;
  position: { x: number; y: number };
  style: SubtitleStyle;
}

interface AdvancedSubtitleRendererProps {
  subtitle: Subtitle;
  currentTime: number;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  editingSubtitle?: boolean;
  editingText?: string;
  onTextChange?: (text: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

// Create confetti particle
const createConfettiParticle = (x: number, y: number, color: string) => {
  const particle = document.createElement('div');
  particle.style.position = 'absolute';
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.width = '6px';
  particle.style.height = '6px';
  particle.style.backgroundColor = color;
  particle.style.borderRadius = '50%';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '1000';
  
  // Random animation
  const deltaX = (Math.random() - 0.5) * 100;
  const deltaY = (Math.random() - 0.5) * 100;
  
  particle.animate([
    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
    { transform: `translate(${deltaX}px, ${deltaY}px) rotate(360deg)`, opacity: 0 }
  ], {
    duration: 800,
    easing: 'ease-out'
  }).onfinish = () => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  };
  
  return particle;
};

const AdvancedSubtitleRenderer: React.FC<AdvancedSubtitleRendererProps> = ({
  subtitle,
  currentTime,
  position,
  onMouseDown,
  onDoubleClick,
  editingSubtitle,
  editingText,
  onTextChange,
  onSaveEdit,
  onCancelEdit
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeWords, setActiveWords] = useState<Set<number>>(new Set());

  // Debug: Log complete subtitle object on mount and when it changes
  useEffect(() => {
    console.log('AdvancedSubtitleRenderer: Complete subtitle object:', subtitle);
    console.log('AdvancedSubtitleRenderer: Subtitle words:', subtitle.words);
    console.log('AdvancedSubtitleRenderer: Words array length:', subtitle.words?.length || 0);
    console.log('AdvancedSubtitleRenderer: Subtitle text:', subtitle.text);
    console.log('AdvancedSubtitleRenderer: Subtitle style preset:', subtitle.style?.preset);
    console.log('AdvancedSubtitleRenderer: Subtitle time range:', subtitle.start_time, '-', subtitle.end_time);
    console.log('AdvancedSubtitleRenderer: Current time:', currentTime);
    console.log('AdvancedSubtitleRenderer: Is subtitle active?', currentTime >= subtitle.start_time && currentTime <= subtitle.end_time);
  }, [subtitle, currentTime]);

  useEffect(() => {
    // Only process word timing if the subtitle is currently active
    const isSubtitleActive = currentTime >= subtitle.start_time && currentTime <= subtitle.end_time;
    
    if (!isSubtitleActive) {
      setActiveWords(new Set());
      return;
    }

    if (!subtitle.words || subtitle.words.length === 0) {
      // Debug: Check if we have word data
      console.log('AdvancedSubtitleRenderer: No word data available for subtitle:', subtitle.text);
      console.log('AdvancedSubtitleRenderer: Using fallback word timing simulation');
      return;
    }

    // Debug: Log word timing data for bubbles effect
    if (subtitle.style?.preset === 'bubbles' || subtitle.style?.preset === 'confetti') {
      console.log(`${subtitle.style.preset} effect - Current time:`, currentTime);
      console.log(`${subtitle.style.preset} effect - Words:`, subtitle.words);
      console.log(`${subtitle.style.preset} effect - Words count:`, subtitle.words.length);
      console.log(`${subtitle.style.preset} effect - Subtitle time range:`, subtitle.start_time, '-', subtitle.end_time);
      console.log(`${subtitle.style.preset} effect - Subtitle is active:`, isSubtitleActive);
    }

    const newActiveWords = new Set<number>();
    
    // For confetti effect, only show one word at a time (the most recent active word)
    if (subtitle.style?.preset === 'confetti') {
      let currentActiveWord = -1;
      
      // Find the currently active word (latest one being spoken)
      // Add small buffer to prevent overlapping animations
      for (let index = 0; index < subtitle.words.length; index++) {
        const word = subtitle.words[index];
        const bufferTime = 0.05; // 50ms buffer
        if (currentTime >= word.start_time && currentTime <= (word.end_time - bufferTime)) {
          currentActiveWord = index;
          console.log(`Confetti - Word ${index} "${word.word}" is active at time ${currentTime} (${word.start_time}-${word.end_time})`);
        }
      }
      
      // Only add the current word to active words
      if (currentActiveWord >= 0) {
        newActiveWords.add(currentActiveWord);
        
        // Trigger confetti effect for newly active words
        if (!activeWords.has(currentActiveWord) && containerRef.current) {
          console.log('Triggering confetti for word:', subtitle.words[currentActiveWord].word);
          const container = containerRef.current;
          const rect = container.getBoundingClientRect();
          const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#9370DB'];
          
          // Create multiple confetti particles
          for (let i = 0; i < 8; i++) {
            setTimeout(() => {
              const color = colors[Math.floor(Math.random() * colors.length)];
              const x = rect.left + rect.width * Math.random();
              const y = rect.top + rect.height * Math.random();
              const particle = createConfettiParticle(x, y, color);
              document.body.appendChild(particle);
            }, i * 30);
          }
        }
      }
    } else if (subtitle.style?.preset === 'bubbles') {
      // For bubbles effect, also show one word at a time for cleaner animation
      let currentActiveWord = -1;
      
      // Find the currently active word (latest one being spoken)
      // Add small buffer to prevent overlapping animations
      for (let index = 0; index < subtitle.words.length; index++) {
        const word = subtitle.words[index];
        const bufferTime = 0.05; // 50ms buffer
        if (currentTime >= word.start_time && currentTime <= (word.end_time - bufferTime)) {
          currentActiveWord = index;
          console.log(`Bubbles - Word ${index} "${word.word}" is active at time ${currentTime} (${word.start_time}-${word.end_time})`);
        }
      }
      
      // Only add the current word to active words
      if (currentActiveWord >= 0) {
        newActiveWords.add(currentActiveWord);
      }
    } else {
      // For other effects, show all active words
      subtitle.words.forEach((word, index) => {
        if (currentTime >= word.start_time && currentTime <= word.end_time) {
          newActiveWords.add(index);
        }
      });
    }

    // Debug: Log active words count
    if ((subtitle.style?.preset === 'bubbles' || subtitle.style?.preset === 'confetti') && newActiveWords.size > 0) {
      console.log(`${subtitle.style.preset} effect - Active words count:`, newActiveWords.size, 'Active words:', Array.from(newActiveWords));
    }

    setActiveWords(newActiveWords);
  }, [currentTime, subtitle.words, subtitle.style?.preset]); // Removed activeWords from dependencies to prevent infinite loop

  const renderWords = () => {
    if (!subtitle.words || subtitle.words.length === 0) {
      // Fallback: Create word-level effects even without word timing data
      if (subtitle.style?.preset === 'bubbles' || subtitle.style?.preset === 'confetti') {
        console.log('Using fallback word timing for preset:', subtitle.style.preset);
        const words = subtitle.text.split(' ');
        const wordsPerSecond = words.length / (subtitle.end_time - subtitle.start_time);
        
        // Find the currently active word for cleaner animation
        let activeWordIndex = -1;
        for (let i = 0; i < words.length; i++) {
          const wordStartTime = subtitle.start_time + (i / wordsPerSecond);
          const wordEndTime = subtitle.start_time + ((i + 1) / wordsPerSecond);
          const bufferTime = 0.05; // 50ms buffer
          if (currentTime >= wordStartTime && currentTime <= (wordEndTime - bufferTime)) {
            activeWordIndex = i;
            break;
          }
        }
        
        return words.map((word, index) => {
          const isActive = index === activeWordIndex;
          
          // Debug: Log fallback timing
          if (isActive && subtitle.style?.preset === 'bubbles') {
            const wordStartTime = subtitle.start_time + (index / wordsPerSecond);
            const wordEndTime = subtitle.start_time + ((index + 1) / wordsPerSecond);
            console.log(`Fallback bubbles - Active word ${index}: "${word}" (${wordStartTime.toFixed(2)}-${wordEndTime.toFixed(2)})`);
          }
          
          const baseStyle: React.CSSProperties = {
            display: 'inline-block',
            margin: '0 0.1em',
            flexShrink: 0,
          };

          if (subtitle.style?.preset === 'confetti') {
            return (
              <span
                key={index}
                style={{
                  ...baseStyle,
                  opacity: isActive ? 1 : 0.4,
                  transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  transition: isActive ? 'all 0.1s ease-out' : 'all 0.05s ease-in',
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  textShadow: isActive 
                    ? '0 0 15px #FFD700, 0 0 25px #FFD700, 2px 2px 4px rgba(0, 0, 0, 0.8)'
                    : '2px 2px 4px rgba(0, 0, 0, 0.8)',
                }}
              >
                {word}
              </span>
            );
          }

          if (subtitle.style?.preset === 'bubbles') {
            return (
              <span
                key={index}
                style={{
                  ...baseStyle,
                  color: isActive ? '#FF1493' : (subtitle.style?.color || '#FFFFFF'),
                  transform: isActive ? 'scale(1.4)' : 'scale(1)',
                  transition: isActive ? 'all 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'all 0.05s ease-in',
                  textShadow: isActive 
                    ? '0 0 15px #FF1493, 0 0 25px #FF1493, 0 0 35px #FF1493'
                    : (subtitle.style?.textShadow || '3px 3px 6px rgba(0, 0, 0, 0.8)'),
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              >
                {word}
              </span>
            );
          }

          return (
            <span key={index} style={baseStyle}>
              {word}
            </span>
          );
        });
      }
      
      return subtitle.text;
    }

    console.log('Using actual word timing data for preset:', subtitle.style?.preset);
    return subtitle.words.map((word, index) => {
      const isActive = activeWords.has(index);
      const baseStyle: React.CSSProperties = {
        display: 'inline-block',
        margin: '0 0.1em',
        flexShrink: 0,
      };

      if (subtitle.style?.preset === 'confetti') {
        return (
          <span
            key={index}
            style={{
              ...baseStyle,
              opacity: isActive ? 1 : 0.4,
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
              transition: isActive ? 'all 0.1s ease-out' : 'all 0.05s ease-in',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textShadow: isActive 
                ? '0 0 15px #FFD700, 0 0 25px #FFD700, 2px 2px 4px rgba(0, 0, 0, 0.8)'
                : '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            {word.word}
          </span>
        );
      }

      if (subtitle.style?.preset === 'bubbles') {
        // Debug: Log individual word rendering
        if (isActive) {
          console.log(`Rendering active bubble word: "${word.word}"`);
        }
        
        return (
          <span
            key={index}
            style={{
              ...baseStyle,
              color: isActive ? '#FF1493' : (subtitle.style?.color || '#FFFFFF'),
              transform: isActive ? 'scale(1.4)' : 'scale(1)',
              transition: isActive ? 'all 0.1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'all 0.05s ease-in',
              textShadow: isActive 
                ? '0 0 15px #FF1493, 0 0 25px #FF1493, 0 0 35px #FF1493'
                : (subtitle.style?.textShadow || '3px 3px 6px rgba(0, 0, 0, 0.8)'),
              fontWeight: isActive ? 'bold' : 'normal',
            }}
          >
            {word.word}
          </span>
        );
      }

      return (
        <span key={index} style={baseStyle}>
          {word.word}
        </span>
      );
    });
  };

  // Constrain position to keep text within bounds with appropriate margins
  const getConstrainedPosition = () => {
    // Use larger margins to account for text wrapping and subtitle box size
    const constrainedX = Math.max(10, Math.min(90, position.x));
    const constrainedY = Math.max(10, Math.min(90, position.y));
    return { x: constrainedX, y: constrainedY };
  };

  const getContainerStyle = (): React.CSSProperties => {
    const style = subtitle.style || {};
    const constrainedPos = getConstrainedPosition();
    
    // Calculate responsive font size based on container (video) size
    // Default to 2.5vw (2.5% of viewport width) with min/max constraints
    const responsiveFontSize = Math.max(16, Math.min(48, (style.fontSize || 24)));
    
    return {
      position: 'absolute',
      left: `${constrainedPos.x}%`,
      top: `${constrainedPos.y}%`,
      transform: 'translate(-50%, -50%)',
      fontFamily: style.fontFamily || 'Arial, sans-serif',
      fontSize: `${responsiveFontSize}px`,
      fontWeight: style.fontWeight || 'bold',
      color: style.color || '#FFFFFF',
      background: style.backgroundColor?.includes('gradient') 
        ? style.backgroundColor 
        : undefined,
      backgroundColor: !style.backgroundColor?.includes('gradient') 
        ? (style.backgroundColor || 'rgba(0, 0, 0, 0.7)')
        : undefined,
      textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
      borderRadius: `${style.borderRadius || 4}px`,
      padding: `${style.padding || 8}px`,
      textShadow: style.textShadow || '2px 2px 4px rgba(0, 0, 0, 0.5)',
      fontStyle: style.italic ? 'italic' : 'normal',
      textDecoration: style.underline ? 'underline' : 'none',
      cursor: 'move',
      userSelect: 'none',
      // Remove box shadow for neon effect as requested
      boxShadow: style?.preset === 'neon' ? 'none' : undefined,
      // Enable text wrapping and constrain width to video bounds
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      // Constrain width to 85% of video container to ensure it stays within bounds
      maxWidth: '85%',
      // Ensure minimum width for readability
      minWidth: '200px',
      // Center text within the subtitle box
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // Limit height to prevent subtitle from being too tall
      maxHeight: '30%',
      overflow: 'hidden',
      // Add line height for better readability
      lineHeight: '1.2',
    };
  };

  return (
    <div
      ref={containerRef}
      style={getContainerStyle()}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`subtitle-container ${subtitle.style?.preset || ''}`}
    >
      {editingSubtitle ? (
        <textarea
          value={editingText || ''}
          onChange={(e) => onTextChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSaveEdit?.();
            } else if (e.key === 'Escape') {
              onCancelEdit?.();
            }
          }}
          onBlur={onSaveEdit}
          className="subtitle-editor"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            color: 'inherit',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            width: '100%',
            minWidth: '200px',
            resize: 'none',
            overflow: 'hidden',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: 'inherit',
          }}
          rows={2}
          autoFocus
        />
      ) : (
        <div 
          className="subtitle-content"
          style={{
            textAlign: 'inherit',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.2em',
          }}
        >
          {renderWords()}
        </div>
      )}
    </div>
  );
};

export default AdvancedSubtitleRenderer; 