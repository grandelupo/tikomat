import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Languages, Mic, Film, Upload, Drag, Type, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, Palette, RotateCcw, RotateCw, Move, Settings, Camera } from 'lucide-react';

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

interface WordTiming {
  word: string;
  start: number;
  end: number;
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
}

interface GenerationData {
  generation_id: string;
  processing_status: string;
  language: string;
  progress: GenerationProgress;
  subtitles: Subtitle[];
  quality_metrics?: {
    accuracy_score: number;
    timing_precision: number;
    word_recognition: number;
  };
  srt_file?: string;
  processed_video?: string;
  video_with_subtitles?: string;
  original_video_path?: string;
}

interface GenerationProgress {
  current_step: string;
  percentage: number;
  estimated_time: number;
  processed_duration: number;
  total_duration: number;
}

interface AISubtitleGeneratorProps {
  videoPath: string;
  videoId?: number;
  videoTitle?: string;
}

const AISubtitleGenerator: React.FC<AISubtitleGeneratorProps> = ({ videoPath, videoId, videoTitle }) => {
  const [generationData, setGenerationData] = useState<GenerationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isSettingThumbnail, setIsSettingThumbnail] = useState(false);
  const [languages, setLanguages] = useState<Record<string, any>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [videoProcessingResult, setVideoProcessingResult] = useState<any>(null);
  
  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Subtitle editing state
  const [editingSubtitle, setEditingSubtitle] = useState<string | null>(null);
  const [subtitleText, setSubtitleText] = useState('');
  const [draggedSubtitle, setDraggedSubtitle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const subtitleEditorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default subtitle style
  const defaultStyle: SubtitleStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    bold: true,
    italic: false,
    underline: false,
    borderRadius: 4,
    padding: 8,
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
  };

  useEffect(() => {
    loadAvailableLanguages();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (generationData && generationData.processing_status === 'processing') {
      const interval = setInterval(() => {
        pollGenerationProgress();
      }, 2000);
      setPollingInterval(interval);

      return () => clearInterval(interval);
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [generationData?.processing_status]);

  // Video time update handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const loadAvailableLanguages = async () => {
    try {
      const response = await fetch('/ai/subtitle-languages');
      const result = await response.json();
      if (result.success) {
        setLanguages(result.data);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const startGeneration = async () => {
    if (!videoPath || videoPath.trim() === '') {
      alert('No video file available for subtitle generation. Please ensure the video is properly uploaded.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/ai/subtitle-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          video_path: videoPath,
          video_id: videoId,
          video_title: videoTitle,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGenerationData({
          ...result.data,
          original_video_path: videoPath
        });
      } else {
        console.error('Generation failed:', result.message);
        alert(`Subtitle generation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting generation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const pollGenerationProgress = async () => {
    if (!generationData?.generation_id) return;

    try {
      const response = await fetch('/ai/subtitle-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGenerationData(prevData => ({
          ...prevData!,
          ...result.data,
          original_video_path: prevData?.original_video_path || videoPath
        }));
      }
    } catch (error) {
      console.error('Error polling progress:', error);
    }
  };

  // Video playback controls
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Get current subtitle based on video time
  const getCurrentSubtitle = (): Subtitle | null => {
    if (!generationData?.subtitles) return null;
    
    return generationData.subtitles.find(subtitle => 
      currentTime >= subtitle.start_time && currentTime <= subtitle.end_time
    ) || null;
  };

  // Capture current frame and set as thumbnail
  const setCurrentFrameAsThumbnail = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoId) {
      alert('Unable to capture frame. Please ensure video is loaded.');
      return;
    }

    setIsSettingThumbnail(true);
    
    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', 0.8);
      });
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('video_id', videoId.toString());
      formData.append('frame_id', `frame_${Date.now()}`);
      formData.append('thumbnail', blob, 'thumbnail.jpg');
      formData.append('current_time', currentTime.toString());
      
      const response = await fetch('/ai/set-video-thumbnail-from-frame', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Thumbnail set successfully!');
      } else {
        alert(`Failed to set thumbnail: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      alert('Failed to capture and set thumbnail. Please try again.');
    } finally {
      setIsSettingThumbnail(false);
    }
  };

  // Subtitle editing functions
  const startEditingSubtitle = (subtitleId: string) => {
    const subtitle = generationData?.subtitles.find(s => s.id === subtitleId);
    if (subtitle) {
      setEditingSubtitle(subtitleId);
      setSubtitleText(subtitle.text);
    }
  };

  const saveSubtitleEdit = async () => {
    if (!editingSubtitle || !generationData) return;

    try {
      const response = await fetch('/ai/subtitle-update-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          subtitle_id: editingSubtitle,
          text: subtitleText,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        const updatedSubtitles = generationData.subtitles.map(subtitle =>
          subtitle.id === editingSubtitle
            ? { ...subtitle, text: subtitleText }
            : subtitle
        );
        setGenerationData({ ...generationData, subtitles: updatedSubtitles });
        setEditingSubtitle(null);
        setSubtitleText('');
      }
    } catch (error) {
      console.error('Error updating subtitle:', error);
    }
  };

  const updateSubtitleStyle = async (subtitleId: string, styleUpdates: Partial<SubtitleStyle>) => {
    if (!generationData) return;

    try {
      const response = await fetch('/ai/subtitle-update-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          subtitle_id: subtitleId,
          style: styleUpdates,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        const updatedSubtitles = generationData.subtitles.map(subtitle =>
          subtitle.id === subtitleId
            ? { ...subtitle, style: { ...subtitle.style, ...styleUpdates } }
            : subtitle
        );
        setGenerationData({ ...generationData, subtitles: updatedSubtitles });
      }
    } catch (error) {
      console.error('Error updating subtitle style:', error);
    }
  };

  const updateSubtitlePosition = async (subtitleId: string, position: { x: number; y: number }) => {
    if (!generationData) return;

    try {
      const response = await fetch('/ai/subtitle-update-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          subtitle_id: subtitleId,
          position: position,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        const updatedSubtitles = generationData.subtitles.map(subtitle =>
          subtitle.id === subtitleId
            ? { ...subtitle, position: position }
            : subtitle
        );
        setGenerationData({ ...generationData, subtitles: updatedSubtitles });
      }
    } catch (error) {
      console.error('Error updating subtitle position:', error);
    }
  };

  // Drag and drop handlers
  const handleSubtitleMouseDown = (e: React.MouseEvent, subtitleId: string) => {
    e.preventDefault();
    const subtitle = generationData?.subtitles.find(s => s.id === subtitleId);
    if (!subtitle) return;

    setDraggedSubtitle(subtitleId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedSubtitle || !subtitleEditorRef.current) return;

    const containerRect = subtitleEditorRef.current.getBoundingClientRect();
    const x = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;

    // Constrain to container bounds
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    updateSubtitlePosition(draggedSubtitle, { x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setDraggedSubtitle(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Export transcript
  const exportTranscript = async () => {
    if (!generationData?.generation_id) return;

    try {
      const response = await fetch('/ai/subtitle-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          format: 'srt',
        }),
      });

      const result = await response.json();
      if (result.success) {
        window.open(result.data.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error exporting transcript:', error);
    }
  };

  // Render video with subtitles
  const renderVideoWithSubtitles = async () => {
    if (!generationData?.generation_id) return;

    setIsRendering(true);
    try {
      const response = await fetch('/ai/subtitle-render-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          video_id: videoId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setVideoProcessingResult(result.data);
        alert('Video rendered successfully! The video with subtitles has been uploaded to all platforms.');
      } else {
        alert(`Failed to render video: ${result.message}`);
      }
    } catch (error) {
      console.error('Error rendering video:', error);
      alert('An error occurred while rendering the video. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentSubtitle = getCurrentSubtitle();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">AI Subtitle Generator</h3>
              <p className="text-sm text-gray-600">Generate and edit subtitles with real-time preview</p>
            </div>
          </div>
          
          {!generationData && (
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Languages className="w-4 h-4 inline mr-2" />
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  {Object.entries(languages).map(([code, lang]) => (
                    <option key={code} value={code}>
                      {lang.name} ({lang.accuracy}% accuracy)
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={startGeneration}
                disabled={isGenerating || !videoPath}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Generate Subtitles
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {generationData?.processing_status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="font-medium text-blue-900">Processing: {generationData.progress.current_step}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationData.progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-blue-700">
              <span>{generationData.progress.percentage}% complete</span>
              <span>{formatTime(generationData.progress.processed_duration)} / {formatTime(generationData.progress.total_duration)}</span>
            </div>
          </div>
        )}

        {/* Video Player with Subtitle Overlay - Always visible when video exists */}
        {videoPath && (
          <div className="space-y-6">
            {/* Video Player with Subtitle Overlay */}
            <div className="relative">
              <div 
                ref={subtitleEditorRef}
                className="relative bg-black rounded-lg overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <video
                  ref={videoRef}
                  src={generationData?.original_video_path || videoPath}
                  className="w-full h-auto max-h-96"
                  controls={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Subtitle Overlay */}
                {currentSubtitle && (
                  <div
                    className="absolute cursor-move select-none"
                    style={{
                      left: `${currentSubtitle.position.x}%`,
                      top: `${currentSubtitle.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: currentSubtitle.style?.fontFamily || defaultStyle.fontFamily,
                      fontSize: `${currentSubtitle.style?.fontSize || defaultStyle.fontSize}px`,
                      fontWeight: currentSubtitle.style?.fontWeight || defaultStyle.fontWeight,
                      color: currentSubtitle.style?.color || defaultStyle.color,
                      backgroundColor: currentSubtitle.style?.backgroundColor || defaultStyle.backgroundColor,
                      textAlign: currentSubtitle.style?.textAlign || defaultStyle.textAlign,
                      borderRadius: `${currentSubtitle.style?.borderRadius || defaultStyle.borderRadius}px`,
                      padding: `${currentSubtitle.style?.padding || defaultStyle.padding}px`,
                      textShadow: currentSubtitle.style?.textShadow || defaultStyle.textShadow,
                      fontStyle: currentSubtitle.style?.italic ? 'italic' : 'normal',
                      textDecoration: currentSubtitle.style?.underline ? 'underline' : 'none',
                    }}
                    onMouseDown={(e) => handleSubtitleMouseDown(e, currentSubtitle.id)}
                    onDoubleClick={() => startEditingSubtitle(currentSubtitle.id)}
                  >
                    {editingSubtitle === currentSubtitle.id ? (
                      <input
                        type="text"
                        value={subtitleText}
                        onChange={(e) => setSubtitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveSubtitleEdit();
                          } else if (e.key === 'Escape') {
                            setEditingSubtitle(null);
                            setSubtitleText('');
                          }
                        }}
                        onBlur={saveSubtitleEdit}
                        className="bg-transparent border-none outline-none text-center"
                        style={{ color: 'inherit', fontSize: 'inherit', fontFamily: 'inherit' }}
                        autoFocus
                      />
                    ) : (
                      currentSubtitle.text
                    )}
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  
                  <div className="flex-1">
                    <div
                      ref={progressRef}
                      className="h-2 bg-gray-200 rounded-full cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <span className="text-sm text-gray-600 min-w-0">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  {/* Set Thumbnail Button */}
                  <button
                    onClick={setCurrentFrameAsThumbnail}
                    disabled={isSettingThumbnail || !videoId}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    title="Set current frame as thumbnail"
                  >
                    {isSettingThumbnail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Setting...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Set Thumbnail
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Subtitle Timeline - Only show when subtitles exist */}
            {generationData?.processing_status === 'completed' && generationData.subtitles && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Subtitle Timeline</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {generationData.subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-white transition-colors cursor-pointer ${
                        currentTime >= subtitle.start_time && currentTime <= subtitle.end_time
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-white'
                      }`}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = subtitle.start_time;
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-sm font-mono text-gray-500">
                          {formatTime(subtitle.start_time)} → {formatTime(subtitle.end_time)}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-gray-900">{subtitle.text}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingSubtitle(subtitle.id);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Edit subtitle"
                        >
                          <Type className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubtitle(subtitle.id);
                          }}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Style subtitle"
                        >
                          <Palette className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtitle Style Editor - Only show when subtitles exist and one is selected */}
            {selectedSubtitle && generationData?.subtitles && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Subtitle Style</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.fontSize || defaultStyle.fontSize}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <input
                      type="color"
                      value={generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.color || defaultStyle.color}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { color: e.target.value })}
                      className="w-full h-8 rounded border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                    <input
                      type="color"
                      value={generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.backgroundColor?.replace('rgba(0, 0, 0, 0.7)', '#000000') || '#000000'}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { backgroundColor: e.target.value })}
                      className="w-full h-8 rounded border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'left' })}
                        className="p-2 border rounded hover:bg-gray-100"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'center' })}
                        className="p-2 border rounded hover:bg-gray-100"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'right' })}
                        className="p-2 border rounded hover:bg-gray-100"
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { bold: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.bold })}
                    className={`p-2 border rounded hover:bg-gray-100 ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.bold ? 'bg-purple-100 border-purple-300' : ''}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { italic: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.italic })}
                    className={`p-2 border rounded hover:bg-gray-100 ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.italic ? 'bg-purple-100 border-purple-300' : ''}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { underline: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.underline })}
                    className={`p-2 border rounded hover:bg-gray-100 ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.underline ? 'bg-purple-100 border-purple-300' : ''}`}
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show when subtitles are completed */}
            {generationData?.processing_status === 'completed' && (
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={exportTranscript}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Transcript
                </button>
                
                <button
                  onClick={renderVideoWithSubtitles}
                  disabled={isRendering}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isRendering ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Rendering Video...
                    </>
                  ) : (
                    <>
                      <Film className="w-5 h-5" />
                      Render & Upload to All Platforms
                    </>
                  )}
                </button>
              </div>
            )}

            {videoProcessingResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2">Video Rendered Successfully!</h5>
                <p className="text-green-800 mb-3">
                  Your video with subtitles has been processed and uploaded to all platforms.
                </p>
                {videoProcessingResult.rendered_video_url && (
                  <a
                    href={videoProcessingResult.rendered_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Rendered Video
                  </a>
                )}
              </div>
            )}

            {generationData?.quality_metrics && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Quality Metrics</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{generationData.quality_metrics.accuracy_score}%</div>
                    <div className="text-sm text-blue-600">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{generationData.quality_metrics.timing_precision}%</div>
                    <div className="text-sm text-blue-600">Timing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{generationData.quality_metrics.word_recognition}%</div>
                    <div className="text-sm text-blue-600">Recognition</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Data State - Only show when no video */}
        {!videoPath && (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Available</h3>
            <p className="text-gray-600 mb-4">
              Upload a video to start using the subtitle generator.
            </p>
          </div>
        )}

        {/* Video available but no subtitles yet */}
        {videoPath && !generationData && (
          <div className="mt-6 text-center py-8">
            <Mic className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Subtitles</h4>
            <p className="text-gray-600 mb-4">
              Click "Generate Subtitles" above to start the AI-powered subtitle generation process.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISubtitleGenerator; 