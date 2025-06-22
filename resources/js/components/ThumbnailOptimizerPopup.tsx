import React, { useState } from 'react';
import { X, Image, Sparkles } from 'lucide-react';
import AIThumbnailOptimizer from './AIThumbnailOptimizer';

interface ThumbnailOptimizerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: number;
  videoPath: string;
  title: string;
  onThumbnailSet?: () => void;
}

const ThumbnailOptimizerPopup: React.FC<ThumbnailOptimizerPopupProps> = ({
  isOpen,
  onClose,
  videoId,
  videoPath,
  title,
  onThumbnailSet
}) => {
  if (!isOpen) return null;

  const handleThumbnailSet = () => {
    // Show success confirmation
    const confirmElement = document.createElement('div');
    confirmElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    confirmElement.textContent = '✓ Thumbnail optimized successfully!';
    document.body.appendChild(confirmElement);
    
    setTimeout(() => {
      if (document.body.contains(confirmElement)) {
        document.body.removeChild(confirmElement);
      }
    }, 3000);

    if (onThumbnailSet) {
      onThumbnailSet();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">AI Thumbnail Optimizer</h3>
                <p className="text-sm text-gray-600">Create and optimize thumbnails for better engagement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AIThumbnailOptimizer
            videoId={videoId}
            videoPath={videoPath}
            title={title}
            onThumbnailSet={handleThumbnailSet}
          />
        </div>
      </div>
    </div>
  );
};

export default ThumbnailOptimizerPopup; 