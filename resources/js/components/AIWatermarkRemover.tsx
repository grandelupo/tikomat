import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Scan, Trash2, Download, Settings, BarChart3, 
    Eye, Zap, RefreshCw, AlertCircle, CheckCircle,
    Clock, Target, Layers, Sparkles, PlayCircle,
    StopCircle, Pause, Play, Upload, Image
} from 'lucide-react';

interface WatermarkRemoverProps {
    videoPath?: string;
    onRemovalComplete?: (result: any) => void;
    className?: string;
}

interface Watermark {
    id: string;
    type: string;
    platform?: string;
    confidence: number;
    location: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    properties: any;
    temporal_consistency: number;
    removal_difficulty: string;
    frames_detected: number;
    detection_method?: string;
}

interface DetectionData {
    detection_id: string;
    processing_status: string;
    detected_watermarks: Watermark[];
    analysis_confidence: number;
    processing_time: number;
    frame_analysis: any;
    detection_metadata: any;
}

interface RemovalProgress {
    removal_id: string;
    processing_status: string;
    progress: {
        current_step: string;
        percentage: number;
        estimated_time: number;
        frames_processed: number;
        total_frames: number;
    };
    removal_results: any[];
    quality_assessment: any;
}

const AIWatermarkRemover: React.FC<WatermarkRemoverProps> = ({ 
    videoPath, 
    onRemovalComplete, 
    className 
}) => {
    const [activeTab, setActiveTab] = useState('detection');
    const [loading, setLoading] = useState(false);
    const [detection, setDetection] = useState<DetectionData | null>(null);
    const [removalProgress, setRemovalProgress] = useState<RemovalProgress | null>(null);
    const [selectedWatermarks, setSelectedWatermarks] = useState<string[]>([]);
    const [autoRemovalInProgress, setAutoRemovalInProgress] = useState(false);
    const [removalSettings, setRemovalSettings] = useState({
        method: 'inpainting',
        quality_preset: 'balanced',
        sensitivity: 'medium',
        detection_mode: 'balanced'
    });

    const tabs = [
        { id: 'detection', label: 'Detection', icon: Scan },
        { id: 'removal', label: 'Removal', icon: Trash2 },
        { id: 'progress', label: 'Progress', icon: BarChart3 },
        { id: 'quality', label: 'Quality', icon: Eye },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    const removalMethods = [
        { id: 'inpainting', name: 'AI Inpainting', accuracy: 95, speed: 'Slow', description: 'Advanced neural network fills watermark area' },
        { id: 'content_aware', name: 'Content-Aware Fill', accuracy: 88, speed: 'Medium', description: 'Intelligent background reconstruction' },
        { id: 'temporal_coherence', name: 'Temporal Coherence', accuracy: 92, speed: 'Slow', description: 'Frame-by-frame consistency analysis' },
        { id: 'frequency_domain', name: 'Frequency Domain', accuracy: 85, speed: 'Fast', description: 'Spectral analysis and filtering' }
    ];

    // Auto-detect and remove watermarks in one click
    const findAndRemoveWatermarks = async () => {
        if (!videoPath) {
            alert('No video path provided');
            return;
        }
        
        setAutoRemovalInProgress(true);
        setLoading(true);
        
        try {
            // Step 1: Detect watermarks with enhanced detection
            const response = await fetch('/ai/watermark-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_path: videoPath,
                    sensitivity: removalSettings.sensitivity,
                    detection_mode: 'thorough', // Use thorough mode for best results
                    enable_learning: true, // Enable learning for better future detection
                    platform_focus: 'all', // Detect all platform watermarks
                }),
            });

            const detectionData = await response.json();
            if (!detectionData.success) {
                throw new Error(detectionData.message || 'Watermark detection failed');
            }

            setDetection(detectionData.data);
            const detectedWatermarks = detectionData.data.detected_watermarks || [];
            
            if (detectedWatermarks.length === 0) {
                alert('🎉 No watermarks detected in your video! Your video is clean.');
                setAutoRemovalInProgress(false);
                setLoading(false);
                return;
            }

            // Automatically select all detected watermarks
            setSelectedWatermarks(detectedWatermarks.map((w: Watermark) => w.id));
            setActiveTab('progress');

            // Step 2: Remove watermarks automatically
            const removalResponse = await fetch('/ai/watermark-remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_path: videoPath,
                    watermarks: detectedWatermarks,
                    method: removalSettings.method,
                    quality_preset: 'high', // Use high quality for automatic removal
                }),
            });

            const removalData = await removalResponse.json();
            if (!removalData.success) {
                throw new Error(removalData.message || 'Watermark removal failed');
            }

            setRemovalProgress(removalData.data);
            
            // Start polling for progress updates
            pollProgress(removalData.data.removal_id);

        } catch (error) {
            console.error('Auto watermark removal failed:', error);
            alert(`Failed to remove watermarks: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setAutoRemovalInProgress(false);
            setLoading(false);
        }
    };

    const detectWatermarks = async () => {
        if (!videoPath) return;
        
        setLoading(true);
        try {
            const response = await fetch('/ai/watermark-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_path: videoPath,
                    sensitivity: removalSettings.sensitivity,
                    detection_mode: removalSettings.detection_mode,
                    enable_learning: true, // Enable learning for better detection
                    platform_focus: 'all', // Detect all platform watermarks
                }),
            });

            const data = await response.json();
            if (data.success) {
                setDetection(data.data);
                setSelectedWatermarks(data.data.detected_watermarks.map((w: Watermark) => w.id));
            } else {
                console.error('Watermark detection failed:', data.error);
                alert(`Detection failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error detecting watermarks:', error);
            alert('An error occurred while detecting watermarks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeWatermarks = async () => {
        if (!detection || selectedWatermarks.length === 0) return;

        setLoading(true);
        try {
            const watermarksToRemove = detection.detected_watermarks.filter(
                w => selectedWatermarks.includes(w.id)
            );

            const response = await fetch('/ai/watermark-remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_path: videoPath,
                    watermarks: watermarksToRemove,
                    method: removalSettings.method,
                    quality_preset: removalSettings.quality_preset,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setRemovalProgress(data.data);
                setActiveTab('progress');
                // Start polling for progress updates
                pollProgress(data.data.removal_id);
            } else {
                console.error('Watermark removal failed:', data.error);
                alert(`Removal failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error removing watermarks:', error);
            alert('An error occurred while removing watermarks. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pollProgress = async (removalId: string) => {
        const poll = async () => {
            try {
                const response = await fetch('/ai/watermark-progress', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ removal_id: removalId }),
                });

                const data = await response.json();
                if (data.success) {
                    setRemovalProgress(data.data);
                    
                    if (data.data.processing_status === 'completed') {
                        setAutoRemovalInProgress(false);
                        setLoading(false);
                        onRemovalComplete?.(data.data);
                        return;
                    }
                    
                    if (data.data.processing_status === 'failed') {
                        setAutoRemovalInProgress(false);
                        setLoading(false);
                        alert('Watermark removal failed. Please try again.');
                        return;
                    }
                    
                    if (data.data.processing_status === 'processing') {
                        setTimeout(poll, 3000); // Poll every 3 seconds
                    }
                }
            } catch (error) {
                console.error('Error polling progress:', error);
                setAutoRemovalInProgress(false);
                setLoading(false);
            }
        };

        poll();
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'hard': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'inpainting': return 'text-purple-600 bg-purple-100';
            case 'content_aware': return 'text-blue-600 bg-blue-100';
            case 'temporal_coherence': return 'text-green-600 bg-green-100';
            case 'frequency_domain': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const renderDetectionTab = () => (
        <div className="space-y-6">
            {/* Detection Controls */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Watermark Detection</h3>
                        <p className="text-blue-100">AI-powered watermark detection and analysis</p>
                    </div>
                    <div className="text-6xl opacity-20">
                        <Scan />
                    </div>
                </div>
                <div className="mt-4">
                    <Button
                        onClick={detectWatermarks}
                        disabled={loading || !videoPath}
                        className="bg-white text-blue-600 hover:bg-blue-50"
                    >
                        <Scan className="w-4 h-4 mr-2" />
                        {loading ? 'Detecting...' : 'Detect Watermarks'}
                    </Button>
                </div>
            </div>

            {/* Detection Results */}
            {detection && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Detection Results</h3>
                        <Badge className="bg-green-100 text-green-800">
                            {detection.detected_watermarks.length} watermarks found
                        </Badge>
                    </div>

                    {detection.detected_watermarks.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Scan className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Watermarks Detected</h3>
                            <p className="text-gray-600">The video appears to be clean of watermarks.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {detection.detected_watermarks.map((watermark, index) => (
                                <Card key={watermark.id} className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedWatermarks.includes(watermark.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedWatermarks([...selectedWatermarks, watermark.id]);
                                                        } else {
                                                            setSelectedWatermarks(selectedWatermarks.filter(id => id !== watermark.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <h4 className="font-medium capitalize">{watermark.type} Watermark #{index + 1}</h4>
                                                <Badge className={getDifficultyColor(watermark.removal_difficulty)}>
                                                    {watermark.removal_difficulty}
                                                </Badge>
                                                {watermark.platform && watermark.platform !== 'unknown' && (
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {watermark.platform}
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Confidence:</span>
                                                    <div className="font-medium">{watermark.confidence}%</div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Location:</span>
                                                    <div className="font-medium">
                                                        {watermark.location.x}, {watermark.location.y}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Size:</span>
                                                    <div className="font-medium">
                                                        {watermark.location.width}×{watermark.location.height}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Frames:</span>
                                                    <div className="font-medium">{watermark.frames_detected}</div>
                                                </div>
                                            </div>
                                            
                                            {watermark.detection_method && (
                                                <div className="mt-3 text-xs text-gray-500">
                                                    Detected using: {watermark.detection_method.replace('_', ' ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-2xl">
                                            {watermark.platform === 'tiktok' && '🎵'}
                                            {watermark.platform === 'sora' && '🤖'}
                                            {watermark.platform === 'custom' && '🎨'}
                                            {watermark.type === 'logo' && !watermark.platform && '🎨'}
                                            {watermark.type === 'text' && !watermark.platform && '📝'}
                                            {watermark.type === 'brand' && !watermark.platform && '🏷️'}
                                            {watermark.type === 'channel' && !watermark.platform && '📺'}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderRemovalTab = () => (
        <div className="space-y-6">
            {/* Removal Method Selection */}
            <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Removal Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {removalMethods.map((method) => (
                        <div
                            key={method.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                removalSettings.method === method.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setRemovalSettings(prev => ({ ...prev, method: method.id }))}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{method.name}</h4>
                                <Badge className={getMethodColor(method.id)}>
                                    {method.accuracy}% accuracy
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Speed: {method.speed}</span>
                                <div className="flex items-center">
                                    <div className="flex space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full ${
                                                    i < Math.floor(method.accuracy / 20) 
                                                        ? 'bg-green-500' 
                                                        : 'bg-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Watermarks */}
            {detection && selectedWatermarks.length > 0 && (
                <div className="bg-white rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-4">Selected for Removal</h3>
                    <div className="space-y-3">
                        {detection.detected_watermarks
                            .filter(w => selectedWatermarks.includes(w.id))
                            .map((watermark, index) => (
                                <div key={watermark.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-xl">
                                            {watermark.type === 'logo' && '🎨'}
                                            {watermark.type === 'text' && '📝'}
                                            {watermark.type === 'brand' && '🏷️'}
                                            {watermark.type === 'channel' && '📺'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium capitalize">{watermark.type} Watermark</h4>
                                            <p className="text-sm text-gray-600">{watermark.confidence}% confidence</p>
                                        </div>
                                    </div>
                                    <Badge className={getDifficultyColor(watermark.removal_difficulty)}>
                                        {watermark.removal_difficulty}
                                    </Badge>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Removal Action */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Start Removal</h3>
                        <p className="text-red-100">
                            Remove {selectedWatermarks.length} selected watermark{selectedWatermarks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="text-6xl opacity-20">
                        <Trash2 />
                    </div>
                </div>
                <div className="mt-4">
                    <Button
                        onClick={removeWatermarks}
                        disabled={loading || selectedWatermarks.length === 0}
                        className="bg-white text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : 'Remove Watermarks'}
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderProgressTab = () => (
        <div className="space-y-6">
            {removalProgress ? (
                <>
                    {/* Progress Overview */}
                    <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Removal Progress</h3>
                                <p className="text-green-100">
                                    {removalProgress.processing_status === 'completed' ? 'Completed' : 
                                     removalProgress.processing_status === 'processing' ? 'Processing...' : 
                                     removalProgress.processing_status}
                                </p>
                            </div>
                            <div className="text-6xl opacity-20">
                                {removalProgress.processing_status === 'completed' ? <CheckCircle /> : <RefreshCw />}
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">Progress</span>
                                <span className="text-sm">{removalProgress.progress.percentage}%</span>
                            </div>
                            <Progress value={removalProgress.progress.percentage} className="h-2" />
                        </div>
                    </div>

                    {/* Processing Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-4">
                            <div className="flex items-center space-x-3">
                                <Clock className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Current Step</p>
                                    <p className="font-medium capitalize">{removalProgress.progress.current_step}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center space-x-3">
                                <Layers className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Frames Processed</p>
                                    <p className="font-medium">
                                        {removalProgress.progress.frames_processed} / {removalProgress.progress.total_frames}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center space-x-3">
                                <Zap className="w-8 h-8 text-yellow-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Est. Time</p>
                                    <p className="font-medium">{Math.round(removalProgress.progress.estimated_time / 60)} min</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Removal Results */}
                    {removalProgress.removal_results && removalProgress.removal_results.length > 0 && (
                        <div className="bg-white rounded-lg p-6 border">
                            <h3 className="text-lg font-semibold mb-4">Removal Results</h3>
                            <div className="space-y-3">
                                {removalProgress.removal_results.map((result, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            {result.removal_success ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                            )}
                                            <div>
                                                <p className="font-medium">Watermark {index + 1}</p>
                                                <p className="text-sm text-gray-600">
                                                    {result.removal_success ? 'Successfully removed' : 'Removal failed'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={result.removal_success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                            {result.confidence}% confidence
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Removal</h3>
                    <p className="text-gray-600">Start watermark removal to see progress here.</p>
                </div>
            )}
        </div>
    );

    const renderQualityTab = () => (
        <div className="space-y-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Analysis</h3>
                <p className="text-gray-600">Complete watermark removal to see quality analysis.</p>
            </div>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sensitivity
                        </label>
                        <select
                            value={removalSettings.sensitivity}
                            onChange={(e) => setRemovalSettings(prev => ({ ...prev, sensitivity: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="low">Low - Detect obvious watermarks</option>
                            <option value="medium">Medium - Balanced detection</option>
                            <option value="high">High - Detect subtle watermarks</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detection Mode
                        </label>
                        <select
                            value={removalSettings.detection_mode}
                            onChange={(e) => setRemovalSettings(prev => ({ ...prev, detection_mode: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="fast">Fast - Quick detection</option>
                            <option value="balanced">Balanced - Good accuracy and speed</option>
                            <option value="thorough">Thorough - Maximum accuracy</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Removal Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quality Preset
                        </label>
                        <select
                            value={removalSettings.quality_preset}
                            onChange={(e) => setRemovalSettings(prev => ({ ...prev, quality_preset: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="fast">Fast - Quick processing</option>
                            <option value="balanced">Balanced - Good quality and speed</option>
                            <option value="high">High - Best quality</option>
                            <option value="ultra">Ultra - Maximum quality</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'detection': return renderDetectionTab();
            case 'removal': return renderRemovalTab();
            case 'progress': return renderProgressTab();
            case 'quality': return renderQualityTab();
            case 'settings': return renderSettingsTab();
            default: return renderDetectionTab();
        }
    };

    // If no detection has been run yet, show the main action button
    if (!detection && !autoRemovalInProgress) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Remove Watermarks</h3>
                        <p className="text-sm text-muted-foreground">
                            Automatically detect and remove watermarks from your video using AI
                        </p>
                    </div>
                    <Button 
                        onClick={findAndRemoveWatermarks}
                        disabled={loading || !videoPath}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Scan className="w-4 h-4 mr-2" />
                                Find and Remove Watermarks
                            </>
                        )}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                        This will scan your entire video and automatically remove detected watermarks
                    </div>
                </div>
                
                {/* Advanced Options */}
                <details className="mt-6">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        Advanced Options
                    </summary>
                    <div className="mt-3 space-y-3 p-3 border rounded-lg bg-muted/30">
                        <div>
                            <label className="text-sm font-medium">Detection Sensitivity</label>
                            <select 
                                value={removalSettings.sensitivity}
                                onChange={(e) => setRemovalSettings({...removalSettings, sensitivity: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="low">Low - Fast detection</option>
                                <option value="medium">Medium - Balanced</option>
                                <option value="high">High - Thorough detection</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Removal Method</label>
                            <select 
                                value={removalSettings.method}
                                onChange={(e) => setRemovalSettings({...removalSettings, method: e.target.value})}
                                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                            >
                                {removalMethods.map(method => (
                                    <option key={method.id} value={method.id}>
                                        {method.name} - {method.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </details>
            </div>
        );
    }

    return (
        <div className={`max-w-6xl mx-auto p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Watermark Remover</h1>
                    <p className="text-gray-600">Detect and remove watermarks from your videos</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">
                        AI Powered
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                        High Quality
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {renderActiveTab()}
            </div>
        </div>
    );
};

export default AIWatermarkRemover; 