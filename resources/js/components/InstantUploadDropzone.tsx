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
    X,
    Plus
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

interface QueuedFile {
    file: File;
    id: string;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    processingStage: string;
    error?: string;
}

export default function InstantUploadDropzone({ channel, className }: InstantUploadDropzoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<QueuedFile[]>([]);
    
    const { data, setData, post, processing, errors, progress, reset } = useForm({
        video: null as File | null,
    });

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        const videoFiles = files.filter(file => file.type.startsWith('video/'));
        
        if (videoFiles.length === 0) {
            console.error('Please select valid video files');
            return;
        }
        
        handleMultipleFileSelect(videoFiles);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const validateFile = (file: File): string | null => {
        if (file.size > 100 * 1024 * 1024) {
            return 'File size must be less than 100MB';
        }

        if (!file.type.startsWith('video/')) {
            return 'Please select a valid video file';
        }

        return null;
    };

    const handleMultipleFileSelect = (files: File[]) => {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        files.forEach(file => {
            const error = validateFile(file);
            if (error) {
                invalidFiles.push(`${file.name}: ${error}`);
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            console.error('Invalid files:', invalidFiles.join(', '));
        }

        if (validFiles.length > 0) {
            const newQueuedFiles: QueuedFile[] = validFiles.map(file => ({
                file,
                id: `${Date.now()}-${Math.random()}`,
                status: 'pending',
                progress: 0,
                processingStage: 'Queued for upload...',
            }));

            setUploadQueue(prevQueue => [...prevQueue, ...newQueuedFiles]);
            
            // Start uploading files one by one
            setTimeout(() => processQueue([...uploadQueue, ...newQueuedFiles]), 100);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleMultipleFileSelect(files);
        }
        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    const processQueue = async (queue: QueuedFile[]) => {
        const pendingFiles = queue.filter(item => item.status === 'pending');
        
        if (pendingFiles.length === 0) return;

        const fileToProcess = pendingFiles[0];
        await handleSingleFileUpload(fileToProcess);
        
        // Process next file after a short delay
        setTimeout(() => {
            const updatedQueue = uploadQueue.filter(item => item.status !== 'completed');
            if (updatedQueue.some(item => item.status === 'pending')) {
                processQueue(updatedQueue);
            }
        }, 1000);
    };

    const handleSingleFileUpload = async (queuedFile: QueuedFile) => {
        // Update status to uploading
        setUploadQueue(prevQueue => 
            prevQueue.map(item => 
                item.id === queuedFile.id 
                    ? { ...item, status: 'uploading', processingStage: 'Uploading video...' }
                    : item
            )
        );

        // Create a new form instance for this upload to avoid conflicts
        const formData = new FormData();
        
        // Ensure the file is properly appended to the FormData
        if (queuedFile.file) {
            formData.append('video', queuedFile.file);
        } else {
            throw new Error('No file provided for upload');
        }

        // Use a promise to handle the upload
        return new Promise((resolve, reject) => {
            // Use fetch directly to ensure proper form data handling
            fetch(`/channels/${channel.slug}/videos/instant-upload`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errors => {
                        const errorMessage = errors.video || errors.message || 'Upload failed';
                        throw new Error(errorMessage);
                    });
                }
                return response.json();
            })
            .then(data => {
                setUploadQueue(prevQueue => 
                    prevQueue.map(item => 
                        item.id === queuedFile.id 
                            ? { 
                                ...item, 
                                status: 'completed',
                                progress: 100,
                                processingStage: 'Upload completed successfully!'
                            }
                            : item
                    )
                );
                resolve(data);
            })
            .catch(error => {
                console.error('Upload failed:', error);
                setUploadQueue(prevQueue => 
                    prevQueue.map(item => 
                        item.id === queuedFile.id 
                            ? { 
                                ...item, 
                                status: 'error',
                                error: error.message,
                                processingStage: 'Upload failed'
                            }
                            : item
                    )
                );
                reject(error);
            });
        });
    };

    const removeFromQueue = (fileId: string) => {
        setUploadQueue(prevQueue => prevQueue.filter(item => item.id !== fileId));
    };

    const retryUpload = (fileId: string) => {
        setUploadQueue(prevQueue => 
            prevQueue.map(item => 
                item.id === fileId 
                    ? { ...item, status: 'pending', error: undefined, progress: 0, processingStage: 'Queued for upload...' }
                    : item
            )
        );
        
        setTimeout(() => processQueue(uploadQueue), 100);
    };

    // Show upload queue if there are items
    if (uploadQueue.length > 0) {
        return (
            <div className={cn("space-y-4", className)}>
                {/* Upload Queue */}
                {uploadQueue.map((queuedFile) => (
                    <Card key={queuedFile.id} className="border-2 border-dashed border-blue-300 bg-blue-50/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        {queuedFile.status === 'uploading' || queuedFile.status === 'processing' ? (
                                            <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                                        ) : queuedFile.status === 'completed' ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : queuedFile.status === 'error' ? (
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                        ) : (
                                            <Clock className="w-4 h-4 text-gray-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                            {queuedFile.file.name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {(queuedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {queuedFile.status === 'error' && (
                                        <Button 
                                            onClick={() => retryUpload(queuedFile.id)}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Retry
                                        </Button>
                                    )}
                                    {queuedFile.status !== 'uploading' && queuedFile.status !== 'processing' && (
                                        <Button 
                                            onClick={() => removeFromQueue(queuedFile.id)}
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-gray-500 hover:text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-xs text-blue-700 mb-2">{queuedFile.processingStage}</p>
                            
                            {queuedFile.error && (
                                <p className="text-xs text-red-600 mb-2">{queuedFile.error}</p>
                            )}
                            
                            {(queuedFile.status === 'uploading' || queuedFile.status === 'processing') && queuedFile.progress > 0 && (
                                <div className="w-full bg-blue-200 rounded-full h-1.5">
                                    <div
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${queuedFile.progress}%` }}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                
                {/* Add more files option */}
                <Card 
                    className={cn(
                        "border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30",
                        isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('instant-upload-input-additional')?.click()}
                >
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <Plus className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Add more videos to queue</p>
                        <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleFileInputChange}
                            className="hidden"
                            id="instant-upload-input-additional"
                        />
                    </CardContent>
                </Card>
            </div>
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
                    Drop your videos here or click to select multiple files. AI will automatically generate optimized titles, descriptions, and settings for all your connected platforms.
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
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <Plus className="w-3 h-3 mr-1" />
                        Multiple Files
                    </Badge>
                </div>
                
                <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="instant-upload-input"
                />
                
                <label htmlFor="instant-upload-input">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                        <span>
                            <Upload className="w-5 h-5 mr-2" />
                            Select Videos for Instant Upload
                        </span>
                    </Button>
                </label>
                
                <p className="text-xs text-gray-500 mt-4">
                    Supports MP4, MOV, AVI, WMV, WebM • Max 100MB each • Up to 60 seconds each • Multiple files supported
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