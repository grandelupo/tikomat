import React, { useState, useEffect } from 'react';
import { Play, Square, Download, Languages, Palette, Move, BarChart3, Wand2, Clock, Type, Sparkles, Zap, Settings, Eye, Mic, Volume2, Timer } from 'lucide-react';

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
}

interface WordTiming {
  word: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

interface GenerationProgress {
  current_step: string;
  percentage: number;
  estimated_time: number;
  processed_duration: number;
  total_duration: number;
}

interface SubtitleStyle {
  name: string;
  description: string;
  properties: {
    font_family: string;
    font_size: string;
    font_weight: string;
    color: string;
    background: string;
    padding: string;
    border_radius: string;
    text_align: string;
    [key: string]: any;
  };
}

interface GenerationData {
  generation_id: string;
  processing_status: string;
  language: string;
  style: string;
  position: string;
  progress: GenerationProgress;
  subtitles: Subtitle[];
  quality_metrics?: {
    accuracy_score: number;
    timing_precision: number;
    word_recognition: number;
  };
}

interface AISubtitleGeneratorProps {
  videoPath: string;
}

const AISubtitleGenerator: React.FC<AISubtitleGeneratorProps> = ({ videoPath }) => {
  const [activeTab, setActiveTab] = useState<'generation' | 'timing' | 'styles' | 'position' | 'export'>('generation');
  const [generationData, setGenerationData] = useState<GenerationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [languages, setLanguages] = useState<Record<string, any>>({});
  const [availableStyles, setAvailableStyles] = useState<Record<string, SubtitleStyle>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedStyle, setSelectedStyle] = useState('simple');
  const [selectedPosition, setSelectedPosition] = useState('bottom_center');
  const [customPosition, setCustomPosition] = useState({ x: 50, y: 85 });
  const [selectedSubtitles, setSelectedSubtitles] = useState<string[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const positionPresets = {
    'bottom_center': { x: 50, y: 85, name: 'Bottom Center' },
    'bottom_left': { x: 10, y: 85, name: 'Bottom Left' },
    'bottom_right': { x: 90, y: 85, name: 'Bottom Right' },
    'top_center': { x: 50, y: 15, name: 'Top Center' },
    'top_left': { x: 10, y: 15, name: 'Top Left' },
    'top_right': { x: 90, y: 15, name: 'Top Right' },
    'center': { x: 50, y: 50, name: 'Center' },
    'center_left': { x: 10, y: 50, name: 'Center Left' },
    'center_right': { x: 90, y: 50, name: 'Center Right' }
  };

  useEffect(() => {
    loadAvailableLanguages();
    loadAvailableStyles();
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

  const loadAvailableStyles = async () => {
    try {
      const response = await fetch('/ai/subtitle-styles');
      const result = await response.json();
      if (result.success) {
        setAvailableStyles(result.data);
      }
    } catch (error) {
      console.error('Error loading styles:', error);
    }
  };

  const startGeneration = async () => {
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
          language: selectedLanguage,
          style: selectedStyle,
          position: selectedPosition,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGenerationData(result.data);
        setActiveTab('timing');
      } else {
        console.error('Generation failed:', result.message);
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
        setGenerationData(result.data);
        if (result.data.processing_status === 'completed') {
          setSelectedSubtitles(result.data.subtitles?.map((s: Subtitle) => s.id) || []);
        }
      }
    } catch (error) {
      console.error('Error polling progress:', error);
    }
  };

  const updateStyle = async (style: string, customProperties?: any) => {
    if (!generationData?.generation_id) return;

    try {
      const response = await fetch('/ai/subtitle-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          style: style,
          custom_properties: customProperties,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedStyle(style);
        // Refresh generation data
        pollGenerationProgress();
      }
    } catch (error) {
      console.error('Error updating style:', error);
    }
  };

  const updatePosition = async (position: { x: number; y: number }) => {
    if (!generationData?.generation_id) return;

    try {
      const response = await fetch('/ai/subtitle-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          generation_id: generationData.generation_id,
          position: position,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCustomPosition(position);
        // Refresh generation data
        pollGenerationProgress();
      }
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  const exportSubtitles = async (format: string) => {
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
          format: format,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Handle download
        window.open(result.data.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error exporting subtitles:', error);
    }
  };

  const getDifficultyColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'simple': return <Type className="w-4 h-4" />;
      case 'modern': return <Wand2 className="w-4 h-4" />;
      case 'neon': return <Zap className="w-4 h-4" />;
      case 'typewriter': return <Timer className="w-4 h-4" />;
      case 'bounce': return <Volume2 className="w-4 h-4" />;
      case 'confetti': return <Sparkles className="w-4 h-4" />;
      case 'glass': return <Eye className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);
    return `${minutes}:${remainingSeconds.padStart(5, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI Subtitle Generator</h3>
            <p className="text-sm text-gray-600">Automatically generate subtitles with precise timing and customizable styles</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-gray-50">
        <nav className="flex space-x-1 p-4">
          {[
            { id: 'generation', label: 'Generation', icon: Wand2 },
            { id: 'timing', label: 'Timing', icon: Clock },
            { id: 'styles', label: 'Styles', icon: Palette },
            { id: 'position', label: 'Position', icon: Move },
            { id: 'export', label: 'Export', icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm border'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'generation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Languages className="w-4 h-4 inline mr-2" />
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  {Object.entries(languages).map(([code, lang]) => (
                    <option key={code} value={code}>
                      {lang.name} ({lang.accuracy}% accuracy)
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Palette className="w-4 h-4 inline mr-2" />
                  Style
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isGenerating}
                >
                  {Object.entries(availableStyles).map(([key, style]) => (
                    <option key={key} value={key}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Position Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Move className="w-4 h-4 inline mr-2" />
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(positionPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPosition(key)}
                    className={`p-3 rounded-lg border text-sm transition-colors ${
                      selectedPosition === key
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={isGenerating}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={startGeneration}
                disabled={isGenerating || !videoPath}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Starting Generation...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Subtitles
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timing' && (
          <div className="space-y-6">
            {generationData?.processing_status === 'processing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

            {generationData?.processing_status === 'completed' && generationData.subtitles && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Generated Subtitles</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {generationData.subtitles.length} segments
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {generationData.subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0">
                        <span className="text-sm font-mono text-gray-500">
                          {formatTime(subtitle.start_time)} → {formatTime(subtitle.end_time)}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <p className="text-gray-900">{subtitle.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(subtitle.confidence)}`}>
                            {subtitle.confidence}% confidence
                          </span>
                          <span className="text-xs text-gray-500">
                            {subtitle.words.length} words
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {generationData.quality_metrics && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-2">Quality Metrics</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{generationData.quality_metrics.accuracy_score}%</div>
                        <div className="text-sm text-green-600">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{generationData.quality_metrics.timing_precision}%</div>
                        <div className="text-sm text-green-600">Timing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">{generationData.quality_metrics.word_recognition}%</div>
                        <div className="text-sm text-green-600">Recognition</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Subtitle Styles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(availableStyles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => updateStyle(key)}
                    className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                      selectedStyle === key
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    disabled={!generationData || generationData.processing_status !== 'completed'}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {getStyleIcon(key)}
                      <span className="font-medium text-gray-900">{style.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{style.description}</p>
                    <div className="mt-3 p-2 bg-gray-100 rounded text-sm font-mono">
                      <div className="truncate">Font: {style.properties.font_family}</div>
                      <div className="truncate">Size: {style.properties.font_size}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'position' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Subtitle Position</h4>
              
              {/* Position Presets */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Quick Positions</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(positionPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => updatePosition(preset)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        selectedPosition === key
                          ? 'bg-purple-50 border-purple-300 text-purple-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={!generationData || generationData.processing_status !== 'completed'}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Custom Position</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">X Position (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customPosition.x}
                      onChange={(e) => setCustomPosition({ ...customPosition, x: parseInt(e.target.value) })}
                      className="w-full"
                      disabled={!generationData || generationData.processing_status !== 'completed'}
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">{customPosition.x}%</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Y Position (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={customPosition.y}
                      onChange={(e) => setCustomPosition({ ...customPosition, y: parseInt(e.target.value) })}
                      className="w-full"
                      disabled={!generationData || generationData.processing_status !== 'completed'}
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">{customPosition.y}%</div>
                  </div>
                </div>
                <button
                  onClick={() => updatePosition(customPosition)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  disabled={!generationData || generationData.processing_status !== 'completed'}
                >
                  Apply Custom Position
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Export Subtitles</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { format: 'srt', name: 'SRT', description: 'Standard subtitle format' },
                  { format: 'vtt', name: 'WebVTT', description: 'Web video text tracks' },
                  { format: 'ass', name: 'ASS', description: 'Advanced SubStation Alpha' },
                  { format: 'sub', name: 'SUB', description: 'MicroDVD subtitle' },
                ].map((exportFormat) => (
                  <button
                    key={exportFormat.format}
                    onClick={() => exportSubtitles(exportFormat.format)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
                    disabled={!generationData || generationData.processing_status !== 'completed'}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-900">{exportFormat.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">{exportFormat.description}</p>
                  </button>
                ))}
              </div>

              {generationData && generationData.processing_status === 'completed' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                  <h5 className="font-medium text-gray-900 mb-2">Export Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Subtitles:</span>
                      <span className="ml-2 font-medium">{generationData.subtitles?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Language:</span>
                      <span className="ml-2 font-medium">{languages[generationData.language]?.name || generationData.language}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Style:</span>
                      <span className="ml-2 font-medium">{availableStyles[generationData.style]?.name || generationData.style}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!generationData && activeTab !== 'generation' && (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subtitles Generated</h3>
            <p className="text-gray-600 mb-4">Generate subtitles first to access this feature</p>
            <button
              onClick={() => setActiveTab('generation')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISubtitleGenerator; 