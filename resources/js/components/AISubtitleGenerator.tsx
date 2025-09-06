import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Languages, Mic, Film, Upload, Type, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, Palette, RotateCcw, RotateCw, Move, Settings, Camera, Maximize, Minimize, Wand2, Settings2, X } from 'lucide-react';
import AdvancedSubtitleRenderer from './AdvancedSubtitleRenderer';
import { convertToValidHex } from '@/lib/colorUtils';
import { usePage } from '@inertiajs/react';

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
  custom_bounds?: { x: number; y: number; width: number; height: number };
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
  onSubtitleGenerated?: () => void;
  hideSubtitleControls?: boolean;
}

const AISubtitleGenerator: React.FC<AISubtitleGeneratorProps> = ({ videoPath, videoId, videoTitle, onSubtitleGenerated, hideSubtitleControls = false }) => {
  const { props } = usePage<any>();
  const isLocalEnvironment = props.app?.env === 'local';

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
  const [wordTimingData, setWordTimingData] = useState<any>(null);

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeWords, setActiveWords] = useState<Set<number>>(new Set());

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

  // State for video bounds calculation
  const [videoBounds, setVideoBounds] = useState<{ width: number; height: number; top: number; left: number } | null>(null);

  // Custom bounding box state
  const [customBounds, setCustomBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isEditingBounds, setIsEditingBounds] = useState(false);
  const [boundsBeingDragged, setBoundsBeingDragged] = useState<'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null>(null);
  const [boundsDragStart, setBoundsDragStart] = useState<{ x: number; y: number; bounds: { x: number; y: number; width: number; height: number } } | null>(null);

  // Add state to track if subtitles have been generated
  const [subtitlesGenerated, setSubtitlesGenerated] = useState(false);

  // Subtitle style presets
  const subtitleStylePresets = {
    standard: {
      name: 'Standard',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 32,
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
        fontSize: 36,
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
        fontSize: 40,
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
        fontSize: 38,
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
        fontSize: 36,
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

  // Add effect to track when subtitles are generated
  useEffect(() => {
    if (generationData?.subtitles && generationData.subtitles.length > 0) {
      setSubtitlesGenerated(true);
    }
  }, [generationData?.subtitles]);

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

        // Call the callback when subtitles are found
        if (onSubtitleGenerated) {
          onSubtitleGenerated();
        }

        // Load word timing data if available
        if (result.data.generation_id) {
          loadWordTimingData(result.data.generation_id);
        }
      } else {
        console.log('No existing subtitles found for this video');
      }
    } catch (error) {
      console.error('Error checking existing subtitles:', error);
    }
  };

  const loadWordTimingData = async (generationId: string) => {
    try {
      console.log('Loading word timing data for generation:', generationId);
      const response = await fetch(`/ai/word-timing/${generationId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('Word timing data loaded:', result.data);
          setWordTimingData(result.data);

          // Merge word timing data with existing subtitles
          setGenerationData(prevData => {
            if (!prevData || !prevData.subtitles) return prevData;

            // Create a map of words by subtitle_id for quick lookup
            const wordsBySubtitleId = new Map<string, any[]>();
            result.data.words.forEach((wordData: any) => {
              if (!wordsBySubtitleId.has(wordData.subtitle_id)) {
                wordsBySubtitleId.set(wordData.subtitle_id, []);
              }
              wordsBySubtitleId.get(wordData.subtitle_id)!.push({
                word: wordData.word,
                start_time: wordData.start_time,
                end_time: wordData.end_time,
                confidence: wordData.confidence
              });
            });

            // Update subtitles with word timing data
            const updatedSubtitles = prevData.subtitles.map(subtitle => {
              const words = wordsBySubtitleId.get(subtitle.id) || [];
              console.log(`Merging words for subtitle ${subtitle.id}: ${words.length} words`);
              return {
                ...subtitle,
                words: words
              };
            });

            console.log('Updated subtitles with word timing:', updatedSubtitles);
            console.log('First subtitle word count after merge:', updatedSubtitles[0]?.words?.length || 0);
            console.log('First subtitle words sample:', updatedSubtitles[0]?.words?.slice(0, 3));

            // Debug: Check if any subtitle has word timing data
            const subtitlesWithWords = updatedSubtitles.filter(s => s.words && s.words.length > 0);
            console.log(`Subtitles with word timing: ${subtitlesWithWords.length}/${updatedSubtitles.length}`);

            return {
              ...prevData,
              subtitles: updatedSubtitles
            };
          });
        } else {
          console.log('No word timing data available');
        }
      } else {
        console.log('Word timing data not found or not accessible');
      }
    } catch (error) {
      console.error('Error loading word timing data:', error);
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
        setGenerationData(prevData => {
          const newData = {
            ...prevData!,
            ...result.data,
            original_video_path: prevData?.original_video_path || videoPath
          };

          // Load word timing data when generation completes
          if (result.data.processing_status === 'completed' && result.data.generation_id && !wordTimingData) {
            loadWordTimingData(result.data.generation_id);
            // Call the callback when generation completes
            if (onSubtitleGenerated) {
              onSubtitleGenerated();
            }
          }

          return newData;
        });
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
    e.stopPropagation();
    const subtitle = generationData?.subtitles.find(s => s.id === subtitleId);
    if (!subtitle || !videoRef.current) return;

    setDraggedSubtitle(subtitleId);

    // Get video element bounds
    const videoRect = videoRef.current.getBoundingClientRect();

    // Calculate offset from mouse to the subtitle center point
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
    if (!draggedSubtitle || !videoRef.current) return;

    // Use video element bounds
    const videoRect = videoRef.current.getBoundingClientRect();

    // Calculate where the subtitle center should be positioned
    const centerX = e.clientX - dragOffset.x;
    const centerY = e.clientY - dragOffset.y;

    // Convert to percentage relative to video element, positioning the center
    const x = ((centerX - videoRect.left) / videoRect.width) * 100;
    const y = ((centerY - videoRect.top) / videoRect.height) * 100;

    // Constrain to video bounds (accounting for subtitle size)
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

  // Poll for rendered video status
  const pollRenderedVideoStatus = async () => {
    if (!videoId) return;
    try {
      const response = await fetch('/ai/rendered-video-status', {
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
      if (result.success) {
        setVideoProcessingResult({
          status: result.status,
          rendered_video_path: result.rendered_video_path,
        });
      }
    } catch (error) {
      // Optionally handle error
    }
  };

  // Start polling when rendering is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (videoProcessingResult?.status === 'processing') {
      interval = setInterval(pollRenderedVideoStatus, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoProcessingResult?.status, videoId]);

  // On mount, check if rendering is in progress or completed
  useEffect(() => {
    pollRenderedVideoStatus();
  }, [videoId]);

  // Render video with subtitles (trigger rendering)
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
        setVideoProcessingResult({ status: 'processing', rendered_video_path: null });
        // Polling will start automatically
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

  // Calculate video bounds for proper subtitle positioning
  const updateVideoBounds = () => {
    if (videoRef.current && subtitleEditorRef.current) {
      const videoRect = videoRef.current.getBoundingClientRect();
      const containerRect = subtitleEditorRef.current.getBoundingClientRect();

      if (containerRect) {
        const baseBounds = {
          width: videoRect.width,
          height: videoRect.height,
          top: videoRect.top - containerRect.top,
          left: videoRect.left - containerRect.left,
        };

        // If custom bounds are set, apply them as a percentage of video area
        if (customBounds) {
          setVideoBounds({
            width: baseBounds.width * (customBounds.width / 100),
            height: baseBounds.height * (customBounds.height / 100),
            top: baseBounds.top + (baseBounds.height * (customBounds.y / 100)),
            left: baseBounds.left + (baseBounds.width * (customBounds.x / 100)),
          });
        } else {
          setVideoBounds(baseBounds);
        }
      }
    }
  };

  // Initialize default custom bounds (80% of video area, centered)
  const initializeDefaultBounds = () => {
    if (!customBounds) {
      setCustomBounds({
        x: 10, // 10% from left
        y: 20, // 20% from top (more space for text)
        width: 80, // 80% width
        height: 60, // 60% height (avoid bottom area which might have controls)
      });
    }
  };

  // Save custom bounds to generation data
  const saveCustomBounds = async () => {
    if (!customBounds || !generationData?.generation_id) return;

    try {
      const response = await fetch('/ai/subtitle-update-bounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          custom_bounds: customBounds,
        }),
      });

      if (response.ok) {
        console.log('Custom bounds saved successfully');
      }
    } catch (error) {
      console.error('Error saving custom bounds:', error);
    }
  };

  // Load custom bounds from generation data
  useEffect(() => {
    if (generationData?.custom_bounds) {
      setCustomBounds(generationData.custom_bounds);
    }
  }, [generationData]);

  // Bounding box handlers with improved performance
  const handleBoundsMouseDown = (e: React.MouseEvent, action: 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br') => {
    e.preventDefault();
    e.stopPropagation();

    if (!customBounds || !videoRef.current) return;

    setBoundsBeingDragged(action);
    const videoRect = videoRef.current.getBoundingClientRect();

    setBoundsDragStart({
      x: e.clientX,
      y: e.clientY,
      bounds: { ...customBounds }
    });
  };

  const handleBoundsMouseMove = (e: React.MouseEvent) => {
    if (!boundsBeingDragged || !boundsDragStart || !videoRef.current) return;

    const videoRect = videoRef.current.getBoundingClientRect();
    const deltaX = e.clientX - boundsDragStart.x;
    const deltaY = e.clientY - boundsDragStart.y;

    // Convert pixel deltas to percentages
    const deltaXPercent = (deltaX / videoRect.width) * 100;
    const deltaYPercent = (deltaY / videoRect.height) * 100;

    let newBounds = { ...boundsDragStart.bounds };

    switch (boundsBeingDragged) {
      case 'move':
        newBounds.x = Math.max(0, Math.min(100 - newBounds.width, newBounds.x + deltaXPercent));
        newBounds.y = Math.max(0, Math.min(100 - newBounds.height, newBounds.y + deltaYPercent));
        break;
      case 'resize-tl':
        newBounds.x = Math.max(0, Math.min(newBounds.x + newBounds.width - 10, newBounds.x + deltaXPercent));
        newBounds.y = Math.max(0, Math.min(newBounds.y + newBounds.height - 10, newBounds.y + deltaYPercent));
        newBounds.width = Math.max(10, Math.min(100 - newBounds.x, newBounds.width - deltaXPercent));
        newBounds.height = Math.max(10, Math.min(100 - newBounds.y, newBounds.height - deltaYPercent));
        break;
      case 'resize-tr':
        newBounds.y = Math.max(0, Math.min(newBounds.y + newBounds.height - 10, newBounds.y + deltaYPercent));
        newBounds.width = Math.max(10, Math.min(100 - newBounds.x, newBounds.width + deltaXPercent));
        newBounds.height = Math.max(10, Math.min(100 - newBounds.y, newBounds.height - deltaYPercent));
        break;
      case 'resize-bl':
        newBounds.x = Math.max(0, Math.min(newBounds.x + newBounds.width - 10, newBounds.x + deltaXPercent));
        newBounds.width = Math.max(10, Math.min(100 - newBounds.x, newBounds.width - deltaXPercent));
        newBounds.height = Math.max(10, Math.min(100 - newBounds.y, newBounds.height + deltaYPercent));
        break;
      case 'resize-br':
        newBounds.width = Math.max(10, Math.min(100 - newBounds.x, newBounds.width + deltaXPercent));
        newBounds.height = Math.max(10, Math.min(100 - newBounds.y, newBounds.height + deltaYPercent));
        break;
    }

    setCustomBounds(newBounds);
  };

  const handleBoundsMouseUp = () => {
    setBoundsBeingDragged(null);
    setBoundsDragStart(null);
  };

  // Update video bounds when video loads or window resizes
  useEffect(() => {
    const handleResize = () => {
      // Slight delay to ensure layout has updated
      setTimeout(updateVideoBounds, 50);
    };
    const handleVideoLoad = () => updateVideoBounds();

    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleVideoLoad);
      videoRef.current.addEventListener('loadeddata', handleVideoLoad);
    }

    window.addEventListener('resize', handleResize);

    // Initial calculation with delay
    setTimeout(updateVideoBounds, 100);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', handleVideoLoad);
        videoRef.current.removeEventListener('loadeddata', handleVideoLoad);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [videoPath, customBounds]);

  // Also update bounds when fullscreen state changes
  useEffect(() => {
    setTimeout(updateVideoBounds, 100);
  }, [isFullscreen, customBounds]);

  // Update active words based on current time
  useEffect(() => {
    if (!currentSubtitle?.words || currentSubtitle.words.length === 0) {
      setActiveWords(new Set());
      return;
    }

    const newActiveWords = new Set<number>();

    currentSubtitle.words.forEach((word, index) => {
      if (currentTime >= word.start_time && currentTime <= word.end_time) {
        newActiveWords.add(index);
      }
    });

    setActiveWords(newActiveWords);
  }, [currentTime, currentSubtitle?.words]);

  // Render words with proper timing and formatting
  const renderWords = () => {
    if (!currentSubtitle?.words || currentSubtitle.words.length === 0) {
      // Fallback to simple text rendering if no word timing data
      return (
        <span className="subtitle-text">
          {currentSubtitle?.text || ''}
        </span>
      );
    }

    return currentSubtitle.words.map((word, index) => {
      const isActive = activeWords.has(index);
      const isLastWord = index === currentSubtitle.words.length - 1;

      return (
        <span
          key={`${word.word}-${index}`}
          className={`subtitle-word ${isActive ? 'active' : ''}`}
          style={{
            color: isActive ? (currentSubtitle.style?.color || '#FFFFFF') : (currentSubtitle.style?.color || '#FFFFFF'),
            fontWeight: isActive ? 'bold' : (currentSubtitle.style?.bold ? 'bold' : 'normal'),
            fontStyle: currentSubtitle.style?.italic ? 'italic' : 'normal',
            textDecoration: currentSubtitle.style?.underline ? 'underline' : 'none',
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
    if (!currentSubtitle) return { x: 50, y: 85 };
    // Use larger margins to account for text wrapping and subtitle box size
    const constrainedX = Math.max(10, Math.min(90, currentSubtitle.position.x));
    const constrainedY = Math.max(10, Math.min(90, currentSubtitle.position.y));
    return { x: constrainedX, y: constrainedY };
  };

  const getContainerStyle = (): React.CSSProperties => {
    if (!currentSubtitle) return {};
    const style = currentSubtitle.style || {};
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
      maxWidth: '90vw',
      minWidth: '200px',
      lineHeight: '1.2',
      letterSpacing: '0.5px',
      // Ensure text is always readable
      backdropFilter: 'blur(2px)',
      zIndex: 1000,
    };
  };

  return (
    <div ref={containerRef} className={`bg-background shadow-sm border ${isFullscreen ? 'h-screen w-screen flex flex-col' : 'rounded-lg'}`}>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>

          {!generationData && !hideSubtitleControls && (
            <div className="flex items-center gap-4">
              {!isLocalEnvironment ? (
                <button
                  disabled={true}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-400 text-gray-200 rounded-lg font-medium cursor-not-allowed opacity-50 transition-all"
                >
                  <Mic className="w-7 h-7" />
                  Subtitle Generation Coming Soon
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-muted-foreground" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese</option>
                      {Object.entries(languages).map(([code, language]) => (
                        <option key={code} value={code}>
                          {language.name || code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={startGeneration}
                    disabled={isGenerating || !videoId}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        Generate Subtitles
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
        {generationData?.processing_status === 'processing' && (
          <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
              <span className="font-medium text-blue-200">Processing: {generationData.progress.current_step}</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationData.progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-blue-300">
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
                  className="video-subtitle-overlay"
                  style={{
                    top: videoBounds?.top || 0,
                    left: videoBounds?.left || 0,
                    width: videoBounds?.width || '100%',
                    height: videoBounds?.height || '100%',
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

                {/* Bounding Box Editor Overlay */}
                {isEditingBounds && customBounds && videoRef.current && (
                  <div
                    className="bounds-editor-overlay"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'auto',
                    }}
                    onMouseMove={handleBoundsMouseMove}
                    onMouseUp={handleBoundsMouseUp}
                    onMouseLeave={handleBoundsMouseUp}
                  >
                    {/* Bounding Box Rectangle */}
                    <div
                      className="bounds-rectangle"
                      style={{
                        position: 'absolute',
                        left: `${customBounds.x}%`,
                        top: `${customBounds.y}%`,
                        width: `${customBounds.width}%`,
                        height: `${customBounds.height}%`,
                        border: '3px solid #3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        cursor: 'move',
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease-in-out',
                      }}
                      onMouseDown={(e) => handleBoundsMouseDown(e, 'move')}
                    >
                      {/* Resize handles */}
                      <div
                        className="resize-handle resize-tl"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '-8px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '3px solid white',
                          borderRadius: '50%',
                          cursor: 'nw-resize',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseDown={(e) => handleBoundsMouseDown(e, 'resize-tl')}
                      />
                      <div
                        className="resize-handle resize-tr"
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '3px solid white',
                          borderRadius: '50%',
                          cursor: 'ne-resize',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseDown={(e) => handleBoundsMouseDown(e, 'resize-tr')}
                      />
                      <div
                        className="resize-handle resize-bl"
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          left: '-8px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '3px solid white',
                          borderRadius: '50%',
                          cursor: 'sw-resize',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseDown={(e) => handleBoundsMouseDown(e, 'resize-bl')}
                      />
                      <div
                        className="resize-handle resize-br"
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          right: '-8px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#3b82f6',
                          border: '3px solid white',
                          borderRadius: '50%',
                          cursor: 'se-resize',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseDown={(e) => handleBoundsMouseDown(e, 'resize-br')}
                      />

                      {/* Center indicator */}
                      <div
                        className="center-indicator"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '4px',
                          height: '4px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                          border: '2px solid white',
                        }}
                      />
                    </div>
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
                      className="h-2 bg-muted rounded-full cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <span className="text-sm text-muted-foreground min-w-0">
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

                {/* Bounding Box Controls */}
                {subtitlesGenerated && (
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-foreground">Subtitle Area:</span>

                    <button
                      onClick={() => {
                        initializeDefaultBounds();
                        setIsEditingBounds(!isEditingBounds);
                      }}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                        isEditingBounds
                          ? 'bg-purple-600 text-white'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      <Settings2 className="w-4 h-4" />
                      {isEditingBounds ? 'Finish Editing' : 'Set Boundary'}
                    </button>
                  {customBounds && (
                    <button
                      onClick={() => {
                        setCustomBounds(null);
                        setIsEditingBounds(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-red-950/50 text-red-300 rounded-lg hover:bg-red-900/50 text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Reset to Auto
                    </button>
                  )}
                  {customBounds && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(customBounds.width)}% × {Math.round(customBounds.height)}%
                    </span>
                  )}
                </div>
               )}
              </div>
            </div>

            {/* Subtitle Timeline - Only show when subtitles exist */}
            {generationData?.processing_status === 'completed' && generationData.subtitles && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-lg font-medium text-foreground mb-4">Subtitle Timeline</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {generationData.subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-background transition-colors cursor-pointer ${
                        currentTime >= subtitle.start_time && currentTime <= subtitle.end_time
                          ? 'border-purple-300 bg-purple-950/20'
                          : 'border-border bg-background'
                      }`}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = subtitle.start_time;
                        }
                      }}
                    >
                      <div className="flex-shrink-0">
                        <span className="text-sm font-mono text-muted-foreground">
                          {formatTime(subtitle.start_time)} → {formatTime(subtitle.end_time)}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-foreground">{subtitle.text}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingSubtitle(subtitle.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-purple-400 transition-colors"
                          title="Edit subtitle"
                        >
                          <Type className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubtitle(subtitle.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-purple-400 transition-colors"
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
            {generationData?.processing_status === 'completed' && selectedSubtitle && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="text-lg font-medium text-foreground mb-4">Subtitle Style Editor</h4>

                {/* Style Presets */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-foreground mb-3">Style Presets</h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(subtitleStylePresets).map(([key, preset]) => {
                      const isActive = generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.preset === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            updateSubtitleStyle(selectedSubtitle, { ...preset.style });
                            setSelectedStylePreset(key);
                          }}
                          className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'border-purple-500 bg-purple-950/20 text-purple-300'
                              : 'border-border bg-background text-foreground hover:border-purple-300 hover:bg-purple-950/10'
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className="text-xs mb-1 px-2 py-1 rounded"
                              style={{
                                color: preset.style.color,
                                backgroundColor: (() => {
                                  const bg = preset.style.backgroundColor;
                                  if (bg.includes('gradient')) return '#FFD700';
                                  if (bg === 'transparent') return 'rgba(0, 0, 0, 0)';
                                  return bg;
                                })(),
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

                {/* Style Controls */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Font Family</label>
                    <select
                      value={generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.fontFamily?.split(',')[0] || 'Arial'}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { fontFamily: e.target.value + ', sans-serif' })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-background text-foreground"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Impact">Impact</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Font Size</label>
                    <input
                      type="range"
                      min="12"
                      max="48"
                      value={generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.fontSize || 24}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Text Color</label>
                    <input
                      type="color"
                      value={convertToValidHex(generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.color || '#FFFFFF')}
                      onChange={(e) => updateSubtitleStyle(selectedSubtitle, { color: e.target.value })}
                      className="w-full h-8 rounded border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Background</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(() => {
                          const subtitle = generationData.subtitles.find(s => s.id === selectedSubtitle);
                          const bgColor = subtitle?.style?.backgroundColor || '#000000';
                          return convertToValidHex(bgColor);
                        })()}
                        onChange={(e) => updateSubtitleStyle(selectedSubtitle, { backgroundColor: e.target.value })}
                        className="flex-1 h-8 rounded border"
                      />
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { backgroundColor: 'transparent' })}
                        className="px-3 py-1 text-xs border rounded hover:bg-muted text-foreground"
                        title="Make background transparent"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Alignment</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'left' })}
                        className="p-2 border rounded hover:bg-muted text-foreground"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'center' })}
                        className="p-2 border rounded hover:bg-muted text-foreground"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateSubtitleStyle(selectedSubtitle, { textAlign: 'right' })}
                        className="p-2 border rounded hover:bg-muted text-foreground"
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { bold: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.bold })}
                    className={`p-2 border rounded hover:bg-muted text-foreground ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.bold ? 'bg-purple-950/20 border-purple-300' : ''}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { italic: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.italic })}
                    className={`p-2 border rounded hover:bg-muted text-foreground ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.italic ? 'bg-purple-950/20 border-purple-300' : ''}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateSubtitleStyle(selectedSubtitle, { underline: !generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.underline })}
                    className={`p-2 border rounded hover:bg-muted text-foreground ${generationData.subtitles.find(s => s.id === selectedSubtitle)?.style?.underline ? 'bg-purple-950/20 border-purple-300' : ''}`}
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
                  className="flex items-center gap-2 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AISubtitleGenerator;