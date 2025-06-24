import React, { useCallback, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Upload, 
    FileVideo, 
    Zap, 
    Brain, 
    Sparkles, 
    CheckCircle,
    AlertCircle,
    Clock,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Channel {
    id: number;
    name: string;
    slug: string;
}

interface InstantUploadDropzoneProps {
    channel: Channel;
    className?: string;
}

export default function InstantUploadDropzone({ channel, className }: InstantUploadDropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState<string>('');

    const { data, setData, post, processing, errors, progress, reset } = useForm({
        video: null as File | null,
    });

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith('video/')) {
                handleFileSelect(file);
            } else {
                // Show error for invalid file type
                console.error('Please select a valid video file');
            }
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleFileSelect = (file: File) => {
        // Validate file
        if (file.size > 100 * 1024 * 1024) {
            console.error('File size must be less than 100MB');
            return;
        }

        if (!file.type.startsWith('video/')) {
            console.error('Please select a valid video file');
            return;
        }

        setData('video', file);
        handleInstantUpload(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleInstantUpload = (file: File) => {
        setIsProcessing(true);
        setProcessingStage('Uploading video...');
        
        post(`/channels/${channel.slug}/videos/instant-upload`, {
            onProgress: (progress) => {
                setUploadProgress(progress.percentage || 0);
                if (progress.percentage === 100) {
                    setProcessingStage('AI is analyzing your video...');
                }
            },
            onSuccess: (page) => {
                setProcessingStage('Processing complete! Refreshing page...');
                
                // Give a moment for the user to see the success message
                setTimeout(() => {
                    setIsProcessing(false);
                    setProcessingStage('');
                    setUploadProgress(0);
                    reset();
                    
                    // Refresh the page to show updated videos
                    window.location.reload();
                }, 2000);
            },
            onError: (errors) => {
                console.error('Upload failed:', errors);
                setIsProcessing(false);
                setProcessingStage('');
                setUploadProgress(0);
            },
        });
    };

    const handleCancelUpload = () => {
        setIsProcessing(false);
        setProcessingStage('');
        setUploadProgress(0);
        reset();
    };

    // Show processing state
    if (isProcessing || processing) {
        return (
            <Card className={cn("border-2 border-dashed border-blue-300 bg-blue-50/50", className)}>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        AI Processing Your Video
                    </h3>
                    
                    <p className="text-blue-700 mb-4">{processingStage}</p>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full max-w-xs mb-4">
                            <div className="flex justify-between text-sm text-blue-600 mb-1">
                                <span>Uploading</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-blue-600 mb-4">
                        <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Video Analysis</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Content Generation</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Sparkles className="w-4 h-4" />
                            <span>Platform Optimization</span>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleCancelUpload}
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card 
            className={cn(
                "border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30",
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
                className
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Instant Upload with AI
                </h3>
                
                <p className="text-gray-600 mb-4 max-w-md">
                    Drop your video here or click to select. AI will automatically generate optimized titles, descriptions, and settings for all your connected platforms.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Brain className="w-3 h-3 mr-1" />
                        Smart Analysis
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Auto Subtitles
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        <FileVideo className="w-3 h-3 mr-1" />
                        Watermark Removal
                    </Badge>
                </div>
                
                <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="instant-upload-input"
                />
                
                <label htmlFor="instant-upload-input">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                        <span>
                            <Upload className="w-5 h-5 mr-2" />
                            Select Video for Instant Upload
                        </span>
                    </Button>
                </label>
                
                <p className="text-xs text-gray-500 mt-4">
                    Supports MP4, MOV, AVI, WMV, WebM • Max 100MB • Up to 60 seconds
                </p>
                
                {errors.video && (
                    <Alert className="mt-4 max-w-md border-red-200 bg-red-50">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {errors.video}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
} 