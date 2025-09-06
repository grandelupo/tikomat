import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import AIThumbnailOptimizer from '@/components/AIThumbnailOptimizer';
import AISubtitleGenerator from '@/components/AISubtitleGenerator';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Brain, Wand2, BarChart3, Image, Play, Clock, CheckCircle, XCircle, AlertCircle, Youtube, Instagram, Video as VideoIcon, ExternalLink, X, Trash2, Upload, Star, Eye, Heart, Share, ThumbsUp, Camera, Palette, Type, Layers, Plus, Minus, Settings2, Sparkles, Tag, RefreshCw, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThumbnailOptimizerPopup from '@/components/ThumbnailOptimizerPopup';

interface VideoTarget {
    id: number;
    platform: string;
    status: string;
    error_message: string | null;
    publish_at: string | null;
    platform_video_id?: string;
    platform_url?: string;
}

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    file_path?: string;
    video_path?: string; // Computed attribute from getVideoPathAttribute() - URL route
    original_file_path?: string; // Raw storage path - needed for backend processing
    tags?: string[];
    thumbnail?: string;
    targets?: VideoTarget[];
    width?: number;
    height?: number;
}

interface VideoEditProps {
    video: Video;
}

// Change tracking interface
interface VideoChange {
    type: 'title' | 'description' | 'tags' | 'thumbnail' | 'subtitles';
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
}

// Enhanced platform icons and status mapping
const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: VideoIcon,
    snapchat: VideoIcon,
    pinterest: VideoIcon,
    x: VideoIcon,
};

const statusIcons = {
    pending: Clock,
    processing: AlertCircle,
    success: CheckCircle,
    failed: XCircle,
};

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

// Video quality assessment helper
const getVideoQualityStatus = (width?: number, height?: number) => {
    if (!width || !height) return { status: 'unknown', color: 'text-muted-foreground', label: 'Unknown' };

    const pixels = width * height;
    if (pixels >= 1920 * 1080) return { status: 'great', color: 'text-green-600', label: '1080p+' };
    if (pixels >= 1280 * 720) return { status: 'good', color: 'text-orange-500', label: '720p' };
    return { status: 'poor', color: 'text-red-600', label: 'Low Quality' };
};

export default function VideoEdit({ video }: VideoEditProps) {
    const { props } = usePage<any>();
    const isLocalEnvironment = props.app?.env === 'local';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: 'Videos',
            href: '/videos',
        },
        {
            title: video.title,
            href: `/videos/${video.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || [],
        thumbnail: null,
    });

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteOption, setDeleteOption] = useState<'all' | 'filmate'>('filmate');
    const [generatingTitle, setGeneratingTitle] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(video.thumbnail || null);
    const [thumbnailSliderValue, setThumbnailSliderValue] = useState([0]);
    const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
    const [thumbnailSuggestions, setThumbnailSuggestions] = useState<any[]>([]);
    const [showThumbnailOptimizer, setShowThumbnailOptimizer] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [availablePlatforms] = useState(['youtube', 'instagram', 'tiktok', 'facebook', 'x', 'pinterest', 'snapchat']);
    const [changes, setChanges] = useState<VideoChange[]>([]);
    const [originalData, setOriginalData] = useState({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || [],
        thumbnail: video.thumbnail || null,
        subtitles: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoQuality = getVideoQualityStatus(video.width, video.height);

    // Check for unsaved changes on page load
    const checkForUnsavedChanges = async () => {
        try {
            const response = await fetch(`/videos/${video.id}/check-unsaved-changes`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.has_unsaved_changes) {
                    setHasUnsavedChanges(true);
                    // Convert timestamp strings to Date objects
                    const restoredChanges = (result.changes || []).map((change: any) => ({
                        ...change,
                        timestamp: new Date(change.timestamp)
                    }));
                    setChanges(restoredChanges);
                    // Update form data with the latest unsaved version
                    if (result.latest_data) {
                        setData('title', result.latest_data.title || '');
                        setData('description', result.latest_data.description || '');
                        setData('tags', result.latest_data.tags || []);
                        if (result.latest_data.thumbnail) {
                            setSelectedThumbnail(result.latest_data.thumbnail);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to check for unsaved changes:', error);
        }
    };

    // Auto-save function with debouncing
    const autoSave = async (changeData: any) => {
        // Clear existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        // Set new timeout for debounced save
        const timeoutId = setTimeout(async () => {
            setIsAutoSaving(true);
            try {
                const response = await fetch(`/videos/${video.id}/auto-save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(changeData),
                });

                if (response.ok) {
                    const result = await response.json();
                    setHasUnsavedChanges(true);

                    // Show subtle auto-save indicator
                    const indicator = document.createElement('div');
                    indicator.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md shadow-lg z-50 text-sm';
                    indicator.textContent = '💾 Auto-saved';
                    document.body.appendChild(indicator);
                    setTimeout(() => {
                        if (document.body.contains(indicator)) {
                            document.body.removeChild(indicator);
                        }
                    }, 2000);
                } else {
                    console.error('Auto-save failed:', response.statusText);
                }
            } catch (error) {
                console.error('Auto-save error:', error);
            } finally {
                setIsAutoSaving(false);
            }
        }, 1000); // 1 second debounce

        setAutoSaveTimeout(timeoutId);
    };

    // Change tracking functions
    const addChange = (type: VideoChange['type'], field: string, oldValue: any, newValue: any) => {
        const change: VideoChange = {
            type,
            field,
            oldValue,
            newValue,
            timestamp: new Date()
        };

        setChanges(prev => {
            // Remove any existing change of the same type
            const filtered = prev.filter(c => c.type !== type);
            return [...filtered, change];
        });

        // Trigger auto-save
        const changeData = {
            type,
            field,
            value: newValue,
            [field]: newValue
        };

        autoSave(changeData);
    };

    const removeChange = (type: VideoChange['type']) => {
        setChanges(prev => prev.filter(c => c.type !== type));
        setHasUnsavedChanges(changes.length > 1);
    };

    const clearAllChanges = () => {
        setChanges([]);
        setHasUnsavedChanges(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/videos/${video.id}`);
    };

    const handleDeleteVideo = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(`/videos/${video.id}`, {
            data: { delete_option: deleteOption },
            onSuccess: () => {
                router.visit('/videos');
            },
        });
    };

    const handleRemoveFromPlatform = (targetId: number, platform: string) => {
        if (confirm(`Are you sure you want to remove this video from ${platform}?`)) {
            router.delete(`/video-targets/${targetId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Video page will be refreshed automatically
                },
                onError: (errors) => {
                    console.error('Failed to remove video from platform:', errors);
                    alert('Failed to remove video from platform. Please try again.');
                }
            });
        }
    };

    const getPlatformUrl = (target: VideoTarget) => {
        if (target.platform_url) {
            return target.platform_url;
        }

        // Default platform URLs based on platform_video_id
        switch (target.platform) {
            case 'youtube':
                return target.platform_video_id ? `https://youtube.com/watch?v=${target.platform_video_id}` : null;
            case 'instagram':
                return target.platform_video_id ? `https://instagram.com/p/${target.platform_video_id}` : null;
            case 'tiktok':
                return target.platform_video_id ? `https://tiktok.com/@username/video/${target.platform_video_id}` : null;
            default:
                return null;
        }
    };

    const generateAITitle = async () => {
        setGeneratingTitle(true);
        try {
            const response = await fetch('/ai/generate-video-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: video.id,
                    content_type: 'title',
                    current_title: data.title
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.optimized_title) {
                    const oldTitle = data.title;
                    const newTitle = result.data.optimized_title;

                    setData('title', newTitle);
                    addChange('title', 'title', oldTitle, newTitle);

                    // Show analysis info if available
                    const analysis = result.data.analysis_summary;
                    let message = "Title generated based on video content analysis";

                    if (analysis) {
                        const details = [];
                        if (analysis.has_transcript) details.push("audio transcription");
                        if (analysis.scenes_detected > 0) details.push(`${analysis.scenes_detected} visual scenes`);
                        if (analysis.content_category !== 'unknown') details.push(`${analysis.content_category} content`);

                        if (details.length > 0) {
                            message += `. Analyzed: ${details.join(', ')}.`;
                        }
                    }

                    alert(`✅ AI Title Generated!\n\n${message}`);
                }
            } else {
                const error = await response.json();
                console.error('Failed to generate AI title:', error);
                alert(`Failed to generate title: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to generate AI title:', error);
            alert('An error occurred while generating the title. Please try again.');
        } finally {
            setGeneratingTitle(false);
        }
    };

    const generateAIDescription = async () => {
        setGeneratingDescription(true);
        try {
            const response = await fetch('/ai/generate-video-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: video.id,
                    content_type: 'description',
                    current_description: data.description
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.optimized_description) {
                    const oldDescription = data.description;
                    const newDescription = result.data.optimized_description;

                    setData('description', newDescription);
                    addChange('description', 'description', oldDescription, newDescription);

                    // Show analysis info if available
                    const analysis = result.data.analysis_summary;
                    let message = "Description generated based on video content analysis";

                    if (analysis) {
                        const details = [];
                        if (analysis.has_transcript) details.push("audio transcription");
                        if (analysis.scenes_detected > 0) details.push(`${analysis.scenes_detected} visual scenes`);
                        if (analysis.content_category !== 'unknown') details.push(`${analysis.content_category} content`);

                        if (details.length > 0) {
                            message += `. Analyzed: ${details.join(', ')}.`;
                        }
                    }

                    alert(`✅ AI Description Generated!\n\n${message}`);
                }
            } else {
                const error = await response.json();
                console.error('Failed to generate AI description:', error);
                alert(`Failed to generate description: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to generate AI description:', error);
            alert('An error occurred while generating the description. Please try again.');
        } finally {
            setGeneratingDescription(false);
        }
    };

    const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploadingThumbnail(true);
        setCustomThumbnail(file);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('thumbnail', file);
            formData.append('video_id', video.id.toString());

            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            console.log('CSRF Token:', csrfToken ? 'Found' : 'Missing');

            const response = await fetch('/ai/upload-custom-thumbnail', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const oldThumbnail = selectedThumbnail;
                    const newThumbnail = result.thumbnail_url;

                    setSelectedThumbnail(newThumbnail);

                    // This will trigger auto-save and show the unsaved changes window
                    addChange('thumbnail', 'thumbnail', oldThumbnail, newThumbnail);

                    // Show success message
                    const successElement = document.createElement('div');
                    successElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    successElement.textContent = '✅ Thumbnail uploaded successfully!';
                    document.body.appendChild(successElement);
                    setTimeout(() => {
                        if (document.body.contains(successElement)) {
                            document.body.removeChild(successElement);
                        }
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Upload failed');
                }
            } else {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                console.log('Error response content-type:', contentType);

                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    throw new Error(error.message || `HTTP ${response.status}: Upload failed`);
                } else {
                    // HTML error response - log first 200 characters
                    const text = await response.text();
                    console.log('HTML error response:', text.substring(0, 200));
                    throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON - check Laravel logs`);
                }
            }
        } catch (error) {
            console.error('Failed to upload thumbnail:', error);

            // Show error message
            const errorElement = document.createElement('div');
            errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorElement.textContent = `❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
            document.body.appendChild(errorElement);
            setTimeout(() => {
                if (document.body.contains(errorElement)) {
                    document.body.removeChild(errorElement);
                }
            }, 5000);

            // Fallback: show local preview and trigger change tracking
            const reader = new FileReader();
            reader.onload = (e) => {
                const oldThumbnail = selectedThumbnail;
                const newThumbnail = e.target?.result as string;
                setSelectedThumbnail(newThumbnail);
                // This will trigger auto-save and show the unsaved changes window
                addChange('thumbnail', 'thumbnail', oldThumbnail, newThumbnail);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploadingThumbnail(false);
        }
    };


    const generateThumbnailSuggestions = async () => {
        try {
            const response = await fetch('/ai/generate-thumbnail-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ video_id: video.id }),
            });

            if (response.ok) {
                const result = await response.json();
                setThumbnailSuggestions(result.suggestions || []);
            }
        } catch (error) {
            console.error('Failed to generate thumbnail suggestions:', error);
        }
    };

    // Mock data for demonstration - replace with real API calls
    const mockScores = {
        videoQuality: 8.5,
        engagementScore: 7.2,
        viralityPotential: 6.8,
        expectedViews: '12.5K',
        expectedLikes: '850',
        expectedShares: '120'
    };

    const mockThumbnailRating = {
        contrast: 8.2,
        faceVisibility: 9.1,
        textReadability: 7.5,
        emotionalAppeal: 8.7,
        visualHierarchy: 7.8,
        brandConsistency: 8.0,
        predictedCTR: 6.9
    };

    // Check for unsaved changes on component mount
    useEffect(() => {
        checkForUnsavedChanges();
    }, []);

    // Cleanup auto-save timeout on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }
        };
    }, [autoSaveTimeout]);

    // Track changes for platform update button
    useEffect(() => {
        setHasUnsavedChanges(changes.length > 0);
    }, [changes]);

    const generateTags = async () => {
        setIsGeneratingTags(true);

        const makeRequest = async (retryCount = 0) => {
            try {
                // Get CSRF token with fallback
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                                document.querySelector('input[name="_token"]')?.getAttribute('value') || '';

                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }

                const response = await fetch('/ai/analyze-video-tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        video_id: video.id,
                        title: data.title || '',
                        description: data.description || ''
                    }),
                });

                // If we get a CSRF error and haven't retried yet, try to refresh the token
                if (response.status === 419 && retryCount === 0) {
                    console.log('CSRF token expired, refreshing...');

                    // Try to refresh the CSRF token
                    const tokenResponse = await fetch('/');
                    if (tokenResponse.ok) {
                        const html = await tokenResponse.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                        if (newToken) {
                            // Update the token in the current page
                            const currentTokenMeta = document.querySelector('meta[name="csrf-token"]');
                            if (currentTokenMeta) {
                                currentTokenMeta.setAttribute('content', newToken);
                            }

                            // Retry the request with the new token
                            return makeRequest(1);
                        }
                    }
                }

                return response;
            } catch (error) {
                if (retryCount === 0) {
                    console.log('Request failed, retrying once...', error);
                    return makeRequest(1);
                } else {
                    throw error;
                }
            }
        };

        try {
            const response = await makeRequest();

            if (response.ok) {
                const result = await response.json();
                console.log('Tag generation response:', result);

                if (result.success && result.data && result.data.analysis.tags) {
                    const oldTags = data.tags;
                    const newTags = result.data.analysis.tags;

                    setData('tags', newTags);
                    addChange('tags', 'tags', oldTags, newTags);
                } else {
                    console.warn('Unexpected response structure:', result);
                    // Show user-friendly error message
                    const errorElement = document.createElement('div');
                    errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    errorElement.textContent = '⚠️ Tag generation failed - unexpected response';
                    document.body.appendChild(errorElement);
                    setTimeout(() => {
                        if (document.body.contains(errorElement)) {
                            document.body.removeChild(errorElement);
                        }
                    }, 5000);
                }
            } else {
                // Handle HTTP error response
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, response.statusText, errorText);

                // Show user-friendly error message
                const errorElement = document.createElement('div');
                errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                errorElement.textContent = `⚠️ Tag generation failed - Server error (${response.status})`;
                document.body.appendChild(errorElement);
                setTimeout(() => {
                    if (document.body.contains(errorElement)) {
                        document.body.removeChild(errorElement);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to generate tags:', error);

            // Show user-friendly error message
            const errorElement = document.createElement('div');
            errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorElement.textContent = '⚠️ Tag generation failed - Network error';
            document.body.appendChild(errorElement);
            setTimeout(() => {
                if (document.body.contains(errorElement)) {
                    document.body.removeChild(errorElement);
                }
            }, 5000);
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const addTag = (tag: string) => {
        if (!data.tags.includes(tag)) {
            const newTags = [...data.tags, tag];
            setData('tags', newTags);
            addChange('tags', 'tags', originalData.tags, newTags);
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = data.tags.filter(tag => tag !== tagToRemove);
        setData('tags', newTags);
        addChange('tags', 'tags', originalData.tags, newTags);
    };

    const updateAllPlatforms = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/videos/${video.id}/publish-changes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const result = await response.json();
                clearAllChanges();

                // Show success message
                const confirmElement = document.createElement('div');
                confirmElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                confirmElement.textContent = result.message || '✓ Changes published to all platforms successfully!';
                document.body.appendChild(confirmElement);

                setTimeout(() => {
                    if (document.body.contains(confirmElement)) {
                        document.body.removeChild(confirmElement);
                    }
                }, 3000);

                // If jobs were created, show additional info
                if (result.jobs_created > 0) {
                    const jobInfo = document.createElement('div');
                    jobInfo.className = 'fixed top-16 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    jobInfo.textContent = `📋 ${result.jobs_created} update job(s) queued for processing`;
                    document.body.appendChild(jobInfo);

                    setTimeout(() => {
                        if (document.body.contains(jobInfo)) {
                            document.body.removeChild(jobInfo);
                        }
                    }, 5000);
                }
            } else {
                const error = await response.json();
                console.error('Failed to publish changes:', error);

                const errorElement = document.createElement('div');
                errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                errorElement.textContent = `❌ Failed to publish changes: ${error.message || 'Unknown error'}`;
                document.body.appendChild(errorElement);

                setTimeout(() => {
                    if (document.body.contains(errorElement)) {
                        document.body.removeChild(errorElement);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to publish changes:', error);

            const errorElement = document.createElement('div');
            errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorElement.textContent = '❌ Network error while publishing changes';
            document.body.appendChild(errorElement);

            setTimeout(() => {
                if (document.body.contains(errorElement)) {
                    document.body.removeChild(errorElement);
                }
            }, 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const discardAllChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/videos/${video.id}/discard-changes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const result = await response.json();

                // Restore original data from database backup
                if (result.original_data) {
                    setData('title', result.original_data.title || '');
                    setData('description', result.original_data.description || '');
                    setData('tags', result.original_data.tags || []);
                    setSelectedThumbnail(result.original_data.thumbnail || null);
                }

                clearAllChanges();

                // Show success message
                const confirmElement = document.createElement('div');
                confirmElement.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                confirmElement.textContent = '↺ All changes discarded and reverted to original version';
                document.body.appendChild(confirmElement);

                setTimeout(() => {
                    if (document.body.contains(confirmElement)) {
                        document.body.removeChild(confirmElement);
                    }
                }, 3000);
            } else {
                const error = await response.json();
                console.error('Failed to discard changes:', error);

                const errorElement = document.createElement('div');
                errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                errorElement.textContent = `❌ Failed to discard changes: ${error.message || 'Unknown error'}`;
                document.body.appendChild(errorElement);

                setTimeout(() => {
                    if (document.body.contains(errorElement)) {
                        document.body.removeChild(errorElement);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to discard changes:', error);

            const errorElement = document.createElement('div');
            errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorElement.textContent = '❌ Network error while discarding changes';
            document.body.appendChild(errorElement);

            setTimeout(() => {
                if (document.body.contains(errorElement)) {
                    document.body.removeChild(errorElement);
                }
            }, 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubtitleGenerated = () => {
        addChange('subtitles', 'subtitles', false, true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${video.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/videos">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Videos
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
                            <p className="text-muted-foreground">
                                Edit and optimize your video with AI-powered tools
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAutoSaving && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                Auto-saving...
                            </div>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleDeleteVideo}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Unsaved Changes Window - Show when there are unsaved changes */}
                {hasUnsavedChanges && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500 rounded-full">
                                        <AlertCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-orange-800 text-lg">Unsaved Changes Detected</h3>
                                        <p className="text-sm text-orange-700">The following changes have been made to your video:</p>
                                    </div>
                                </div>

                                {/* List of Changes */}
                                <div className="space-y-2">
                                    {changes.map((change, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-orange-200">
                                            <div className="flex-shrink-0">
                                                {change.type === 'title' && <Type className="w-4 h-4 text-blue-600" />}
                                                {change.type === 'description' && <FileText className="w-4 h-4 text-green-600" />}
                                                {change.type === 'tags' && <Tag className="w-4 h-4 text-purple-600" />}
                                                {change.type === 'thumbnail' && <Image className="w-4 h-4 text-pink-600" />}
                                                {change.type === 'subtitles' && <Play className="w-4 h-4 text-indigo-600" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground capitalize">
                                                    {change.type.replace('_', ' ')} Updated
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {change.type === 'title' && `"${change.oldValue}" → "${change.newValue}"`}
                                                    {change.type === 'description' && 'Description content modified'}
                                                    {change.type === 'tags' && `${change.oldValue.length} → ${change.newValue.length} tags`}
                                                    {change.type === 'thumbnail' && 'Custom thumbnail uploaded'}
                                                    {change.type === 'subtitles' && 'Subtitles generated and applied'}
                                                </p>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {change.timestamp.toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={discardAllChanges}
                                        variant="outline"
                                        disabled={isSaving}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        {isSaving ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                        ) : (
                                            <X className="w-4 h-4 mr-2" />
                                        )}
                                        {isSaving ? 'Discarding...' : 'Discard All Changes'}
                                    </Button>
                                    <Button
                                        onClick={updateAllPlatforms}
                                        disabled={isSaving}
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isSaving ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        {isSaving ? 'Publishing...' : 'Publish Changes to All Platforms'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Content */}
                <div className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">





                                {/* Video Preview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            Video Preview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ErrorBoundary>
                                            <AISubtitleGenerator
                                                videoPath={video.video_path || video.file_path || ''}
                                                videoId={video.id}
                                                videoTitle={video.title}
                                                onSubtitleGenerated={handleSubtitleGenerated}
                                                hideSubtitleControls={true}
                                            />
                                        </ErrorBoundary>
                                    </CardContent>
                                </Card>

                                {/* Publishing Status */}
                                {video.targets && video.targets.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Publishing Status</CardTitle>
                                            <CardDescription>
                                                Current status for each platform
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {video.targets.map((target) => {
                                                    const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                                    const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];
                                                    const platformUrl = getPlatformUrl(target);

                                                    return (
                                                        <div key={target.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <PlatformIcon className="h-5 w-5" />
                                                                <div>
                                                                    <p className="font-medium capitalize">{target.platform}</p>
                                                                    {target.publish_at && (
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Scheduled: {new Date(target.publish_at).toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={statusColors[target.status as keyof typeof statusColors]}>
                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                    {target.status}
                                                                </Badge>
                                                                {platformUrl && target.status === 'success' && (
                                                                    <a
                                                                        href={platformUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-700"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {target.status === 'success' && target.platform !== 'youtube' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleRemoveFromPlatform(target.id, target.platform)}
                                                                        className="text-red-600 hover:text-red-700"
                                                                    >
                                                                        <X className="w-3 h-3 mr-1" />
                                                                        Remove
                                                                    </Button>
                                                                )}
                                                                {target.status === 'success' && target.platform === 'youtube' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled
                                                                        className="text-gray-400"
                                                                        title="YouTube video removal is not supported"
                                                                    >
                                                                        <X className="w-3 h-3 mr-1" />
                                                                        Remove
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* 3. Editable Title Field */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Title</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={data.title}
                                                    onChange={(e) => {
                                                        const newTitle = e.target.value;
                                                        setData('title', newTitle);
                                                        addChange('title', 'title', originalData.title, newTitle);
                                                    }}
                                                    placeholder="Enter video title"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={generateAITitle}
                                                    disabled={generatingTitle}
                                                >
                                                    {generatingTitle ? (
                                                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                    ) : (
                                                        <>
                                                        <Brain className="w-4 h-4" />
                                                        AI Generate
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            {errors.title && (
                                                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* 4. Editable Description Field */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Description</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={data.description}
                                                    onChange={(e) => {
                                                        const newDescription = e.target.value;
                                                        setData('description', newDescription);
                                                        addChange('description', 'description', originalData.description, newDescription);
                                                    }}
                                                    placeholder="Enter video description"
                                                    rows={4}
                                                />
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateAIDescription}
                                                        disabled={generatingDescription}
                                                    >
                                                        {generatingDescription ? (
                                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                                        ) : (
                                                            <Brain className="w-4 h-4 mr-2" />
                                                        )}
                                                        AI Generate
                                                    </Button>
                                                </div>
                                            </div>
                                            {errors.description && (
                                                <p className="text-sm text-red-600">{errors.description}</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Tags Section */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Tag className="w-5 h-5" />
                                                Tags
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {data.tags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTag(tag)}
                                                                className="ml-1 text-xs hover:text-red-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    {data.tags.length === 0 && (
                                                        <p className="text-sm text-muted-foreground">No tags added yet</p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Add a tag..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const tag = e.currentTarget.value.trim();
                                                                if (tag) {
                                                                    addTag(tag);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={generateTags}
                                                        disabled={isGeneratingTags}
                                                    >
                                                        {isGeneratingTags ? (
                                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                                        ) : (
                                                            <>
                                                            <Brain className="w-4 h-4 mr-2" />
                                                            AI Generate
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {data.tags.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Tags help categorize your video and improve discoverability across platforms
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                </form>

                                {/* 5. Video Details Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Video Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                                <p className="text-lg">{video.formatted_duration}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Resolution</p>
                                                <p className={`text-lg ${videoQuality.color}`}>
                                                    {video.width && video.height ? `${video.width}x${video.height}` : 'Unknown'}
                                                </p>
                                                <p className={`text-sm ${videoQuality.color}`}>{videoQuality.label}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Upload Date</p>
                                            <p className="text-lg">{new Date(video.created_at).toLocaleString()}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 6. Thumbnail Optimization Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Image className="w-5 h-5" />
                                            Thumbnail Optimization
                                        </CardTitle>
                                        <CardDescription>
                                            Set your video thumbnail using AI optimization or custom upload
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setShowThumbnailOptimizer(true)}
                                                className="bg-purple-600 hover:bg-purple-700"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                AI Optimize Thumbnail
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploadingThumbnail}
                                            >
                                                {isUploadingThumbnail ? (
                                                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                                ) : (
                                                    <Upload className="w-4 h-4 mr-2" />
                                                )}
                                                {isUploadingThumbnail ? 'Uploading...' : 'Upload Custom Thumbnail'}
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleThumbnailUpload}
                                                className="hidden"
                                            />
                                        </div>

                                        {selectedThumbnail && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-700">
                                                    ✓ Thumbnail has been set for this video
                                                </p>
                                            </div>
                                        )}

                                        {video.thumbnail && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-muted-foreground mb-2">Current Thumbnail:</p>
                                                <img
                                                    src={`${video.thumbnail}`}
                                                    alt="Current thumbnail"
                                                    className="w-32 object-cover rounded-lg border"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center hidden">
                                                    <Image className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                            </div>
                        </div>

                </div>

                {/* Delete Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Video</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. Choose what you want to delete:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="delete-filmate"
                                    name="delete-option"
                                    value="filmate"
                                    checked={deleteOption === 'filmate'}
                                    onChange={(e) => setDeleteOption(e.target.value as 'filmate' | 'all')}
                                />
                                <Label htmlFor="delete-filmate">Delete only from Filmate (keep on social platforms)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="delete-all"
                                    name="delete-option"
                                    value="all"
                                    checked={deleteOption === 'all'}
                                    onChange={(e) => setDeleteOption(e.target.value as 'filmate' | 'all')}
                                />
                                <Label htmlFor="delete-all">Delete from everywhere (Filmate + all social platforms)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Delete Video
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Thumbnail Optimizer Popup */}
                <ThumbnailOptimizerPopup
                    isOpen={showThumbnailOptimizer}
                    onClose={() => setShowThumbnailOptimizer(false)}
                    videoId={video.id}
                    videoPath={video.original_file_path || video.file_path || ''}
                    title={data.title}
                    onThumbnailSet={() => {
                        const oldThumbnail = selectedThumbnail;
                        // Use a timestamp-based marker to indicate AI optimization was applied
                        const newThumbnail = `ai_optimized_${Date.now()}`;
                        setSelectedThumbnail(newThumbnail);
                        // This will trigger auto-save and show the unsaved changes window
                        addChange('thumbnail', 'thumbnail', oldThumbnail, newThumbnail);
                        setShowThumbnailOptimizer(false);
                    }}
                />
            </div>
        </AppLayout>
    );
}