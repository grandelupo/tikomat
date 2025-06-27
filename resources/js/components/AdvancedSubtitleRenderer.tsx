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

  // Update active words based on current time
  useEffect(() => {
    if (!subtitle.words || subtitle.words.length === 0) {
      setActiveWords(new Set());
      return;
    }

    const newActiveWords = new Set<number>();
    
    subtitle.words.forEach((word, index) => {
      if (currentTime >= word.start_time && currentTime <= word.end_time) {
        newActiveWords.add(index);
      }
    });
    
    setActiveWords(newActiveWords);
  }, [currentTime, subtitle.words]);

  // Render words with proper timing and formatting
  const renderWords = () => {
    if (!subtitle.words || subtitle.words.length === 0) {
      // Fallback to simple text rendering if no word timing data
      return (
        <span className="subtitle-text">
          {subtitle.text}
        </span>
      );
    }

    return subtitle.words.map((word, index) => {
      const isActive = activeWords.has(index);
      const isLastWord = index === subtitle.words.length - 1;
      
      return (
        <span
          key={`${word.word}-${index}`}
          className={`subtitle-word ${isActive ? 'active' : ''}`}
          style={{
            color: isActive ? (subtitle.style?.color || '#FFFFFF') : (subtitle.style?.color || '#FFFFFF'),
            fontWeight: isActive ? 'bold' : (subtitle.style?.bold ? 'bold' : 'normal'),
            fontStyle: subtitle.style?.italic ? 'italic' : 'normal',
            textDecoration: subtitle.style?.underline ? 'underline' : 'none',
            transition: 'all 0.1s ease-in-out',
            display: 'inline-block',
            marginRight: isLastWord ? '0' : '0.1em',
          }}
        >
          {word.word}
          {!isLastWord && ' '}
        </span>
      );
    });
  };

  // Constrain position to keep text within bounds with appropriate margins
  const getConstrainedPosition = () => {
    // Use larger margins to account for text wrapping and subtitle box size
    const constrainedX = Math.max(15, Math.min(85, position.x));
    const constrainedY = Math.max(15, Math.min(85, position.y));
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
      maxWidth: '80vw',
      minWidth: '200px',
      lineHeight: '1.2',
      letterSpacing: '0.5px',
      // Ensure text is always readable
      backdropFilter: 'blur(2px)',
      zIndex: 1000,
      // Add subtle border for better visibility during editing
      border: editingSubtitle ? '2px solid #3b82f6' : 'none',
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
            letterSpacing: 'inherit',
            padding: '0',
            margin: '0',
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
            gap: '0.1em',
            lineHeight: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          {renderWords()}
        </div>
      )}
    </div>
  );
};

export default AdvancedSubtitleRenderer; 