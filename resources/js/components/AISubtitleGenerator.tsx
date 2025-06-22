import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Languages, Mic, Film, Upload, Type, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, Palette, RotateCcw, RotateCw, Move, Settings, Camera, Maximize, Minimize, Wand2 } from 'lucide-react';
import AdvancedSubtitleRenderer from './AdvancedSubtitleRenderer';

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

interface GenerationData {
  generation_id: string;
  processing_status: string;
  language: string;
  progress: GenerationProgress;
  subtitles: Subtitle[];
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [languages, setLanguages] = useState<Record<string, any>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [selectedStylePreset, setSelectedStylePreset] = useState<string>('standard');
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

  // Subtitle style presets
  const subtitleStylePresets = {
    standard: {
      name: 'Standard',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        textAlign: 'center' as const,
        bold: true,
        italic: false,
        underline: false,
        borderRadius: 4,
        padding: 8,
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        preset: 'standard'
      }
    },
    'no-background': {
      name: 'No Background',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        textAlign: 'center' as const,
        bold: true,
        italic: false,
        underline: false,
        borderRadius: 0,
        padding: 4,
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
        preset: 'no-background'
      }
    },
    neon: {
      name: 'Neon',
      style: {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#00FFFF',
        backgroundColor: 'rgba(0, 20, 40, 0.8)',
        textAlign: 'center' as const,
        bold: true,
        italic: false,
        underline: false,
        borderRadius: 8,
        padding: 12,
        textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
        preset: 'neon'
      }
    },
    confetti: {
      name: 'Confetti',
      style: {
        fontFamily: 'Comic Sans MS, cursive',
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        textAlign: 'center' as const,
        bold: true,
        italic: false,
        underline: false,
        borderRadius: 0,
        padding: 4,
        textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
        preset: 'confetti'
      }
    },
    bubbles: {
      name: 'Bubbles',
      style: {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        textAlign: 'center' as const,
        bold: true,
        italic: false,
        underline: false,
        borderRadius: 0,
        padding: 4,
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
        preset: 'bubbles'
      }
    }
  };

  // Default subtitle style
  const defaultStyle: SubtitleStyle = subtitleStylePresets.standard.style;

  useEffect(() => {
    loadAvailableLanguages();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Separate useEffect for checking existing subtitles when videoId becomes available
  useEffect(() => {
    if (videoId) {
      console.log('Checking existing subtitles for video ID:', videoId);
      checkExistingSubtitles();
    }
  }, [videoId]);

  const checkExistingSubtitles = async () => {
    if (!videoId) {
      console.log('No video ID available, skipping subtitle check');
      return;
    }

    console.log('Checking for existing subtitles for video:', videoId);
    try {
      // Check if subtitles already exist for this video
      const response = await fetch('/ai/subtitle-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          video_id: videoId,
        }),
      });

      const result = await response.json();
      console.log('Subtitle check response:', result);
      
      if (result.success && result.data && result.data.processing_status === 'completed') {
        console.log('Found existing subtitles, loading them:', result.data);
        
        // Ensure all subtitles have proper style objects
        const subtitlesWithStyles = result.data.subtitles?.map((subtitle: any) => ({
          ...subtitle,
          style: subtitle.style || defaultStyle,
          position: subtitle.position || { x: 50, y: 85 }
        })) || [];
        
        setGenerationData({
          ...result.data,
          original_video_path: videoPath,
          subtitles: subtitlesWithStyles
        });
        
        console.log('Loaded subtitles with styles:', subtitlesWithStyles);
      } else {
        console.log('No existing subtitles found for this video');
      }
    } catch (error) {
      console.error('Error checking existing subtitles:', error);
    }
  };

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
    if (!videoId) {
      alert('No video ID available for subtitle generation. Please ensure the video is properly uploaded.');
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
          video_id: videoId,
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
        // Show success confirmation
        const confirmElement = document.createElement('div');
        confirmElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        confirmElement.textContent = '✓ Thumbnail set successfully!';
        document.body.appendChild(confirmElement);
        
        setTimeout(() => {
          document.body.removeChild(confirmElement);
        }, 3000);
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

  const applyStyleToAllSubtitles = async (presetKey: string) => {
    if (!generationData) return;

    const preset = subtitleStylePresets[presetKey as keyof typeof subtitleStylePresets];
    if (!preset) return;

    try {
      const response = await fetch('/ai/apply-style-to-all-subtitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          style: preset.style
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setGenerationData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            subtitles: prev.subtitles.map(sub => ({
              ...sub,
              style: { ...preset.style }
            }))
          };
        });
        setSelectedStylePreset(presetKey);
      }
    } catch (error) {
      console.error('Failed to apply style to all subtitles:', error);
    }
  };

  // Drag and drop handlers
  const handleSubtitleMouseDown = (e: React.MouseEvent, subtitleId: string) => {
    e.preventDefault();
    const subtitle = generationData?.subtitles.find(s => s.id === subtitleId);
    if (!subtitle || !subtitleEditorRef.current) return;

    setDraggedSubtitle(subtitleId);
    
    // Get container and mouse position
    const containerRect = subtitleEditorRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse to the subtitle center point
    // Since subtitle uses transform: translate(-50%, -50%), we need to account for this
    const subtitleElement = e.target as HTMLElement;
    const subtitleRect = subtitleElement.getBoundingClientRect();
    
    // Calculate the center of the subtitle element
    const subtitleCenterX = subtitleRect.left + subtitleRect.width / 2;
    const subtitleCenterY = subtitleRect.top + subtitleRect.height / 2;
    
    // Calculate offset from mouse to subtitle center
    setDragOffset({
      x: e.clientX - subtitleCenterX,
      y: e.clientY - subtitleCenterY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedSubtitle || !subtitleEditorRef.current) return;

    const containerRect = subtitleEditorRef.current.getBoundingClientRect();
    
    // Calculate where the subtitle center should be positioned
    const centerX = e.clientX - dragOffset.x;
    const centerY = e.clientY - dragOffset.y;
    
    // Convert to percentage relative to container, positioning the center
    const x = ((centerX - containerRect.left) / containerRect.width) * 100;
    const y = ((centerY - containerRect.top) / containerRect.height) * 100;

    // Constrain to container bounds (accounting for subtitle size)
    const constrainedX = Math.max(5, Math.min(95, x));
    const constrainedY = Math.max(5, Math.min(95, y));

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

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          // Safari fallback
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any)?.msRequestFullscreen) {
          // IE/Edge fallback
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          // Safari fallback
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          // IE/Edge fallback
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const currentSubtitle = getCurrentSubtitle();

  return (
    <div ref={containerRef} className={`bg-white shadow-sm border ${isFullscreen ? 'h-screen w-screen flex flex-col' : 'rounded-lg'}`}>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Video Editor</h3>
                <p className="text-sm text-gray-600">Generate and edit subtitles with real-time preview</p>
              </div>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
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
                disabled={isGenerating || !videoId}
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
      <div className={`p-6 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
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
                style={{ position: 'relative' }}
              >
                <video
                  ref={videoRef}
                  src={generationData?.original_video_path || videoPath}
                  className={`w-full h-auto ${isFullscreen ? 'max-h-[70vh]' : 'max-h-96'}`}
                  controls={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Subtitle Overlay Container - positioned absolutely over video */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10
                  }}
                >
                  {/* Subtitle Overlay with Advanced Renderer */}
                  {currentSubtitle && (
                    <div style={{ pointerEvents: 'auto' }}>
                      <AdvancedSubtitleRenderer
                        subtitle={currentSubtitle}
                        currentTime={currentTime}
                        position={currentSubtitle.position}
                        onMouseDown={(e) => handleSubtitleMouseDown(e, currentSubtitle.id)}
                        onDoubleClick={() => startEditingSubtitle(currentSubtitle.id)}
                        editingSubtitle={editingSubtitle === currentSubtitle.id}
                        editingText={subtitleText}
                        onTextChange={setSubtitleText}
                        onSaveEdit={saveSubtitleEdit}
                        onCancelEdit={() => {
                          setEditingSubtitle(null);
                          setSubtitleText('');
                        }}
                      />
                    </div>
                  )}
                </div>
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
                
                {/* Style Presets */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Style Presets</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(subtitleStylePresets).map(([key, preset]) => {
                      const selectedSubtitleData = generationData.subtitles.find(s => s.id === selectedSubtitle);
                      const isActive = selectedSubtitleData?.style?.preset === key;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            updateSubtitleStyle(selectedSubtitle, { ...preset.style });
                            setSelectedStylePreset(key);
                          }}
                          className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                            isActive 
                              ? 'border-purple-500 bg-purple-50 text-purple-700' 
                              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <div className="text-center">
                            <div 
                              className="text-xs mb-1 px-2 py-1 rounded"
                              style={{
                                color: preset.style.color,
                                backgroundColor: preset.style.backgroundColor.includes('gradient') 
                                  ? '#FFD700' 
                                  : preset.style.backgroundColor,
                                textShadow: preset.style.textShadow.includes('0px') ? preset.style.textShadow : 'none',
                                fontFamily: preset.style.fontFamily.split(',')[0]
                              }}
                            >
                              Aa
                            </div>
                            {preset.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => applyStyleToAllSubtitles(selectedStylePreset)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Wand2 className="w-4 h-4" />
                      Apply to All Subtitles
                    </button>
                  </div>
                </div>
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
                      value={(() => {
                        const bgColor = generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.backgroundColor || '#000000';
                        // Convert RGBA values to hex for color input
                        if (bgColor.startsWith('rgba(0, 0, 0, 0.7)')) return '#000000';
                        if (bgColor.startsWith('rgba(0, 20, 40, 0.8)')) return '#001428';
                        if (bgColor === 'transparent') return '#000000';
                        return bgColor.startsWith('#') ? bgColor : '#000000';
                      })()}
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
      </div>
    </div>
  );
};

export default AISubtitleGenerator; 