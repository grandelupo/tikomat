import { Video as VideoIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VideoThumbnailProps {
    src: string | null;
    alt: string;
    videoPath?: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function VideoThumbnail({
    src,
    alt,
    videoPath,
    className = '',
    width,
    height
}: VideoThumbnailProps) {
    const [aspectRatio, setAspectRatio] = useState<number>(16/9);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (width && height) {
            // Use provided dimensions if available
            const ratio = width / height;
            // Limit extreme aspect ratios
            if (ratio < 0.5) {
                setAspectRatio(0.5); // Very tall videos
            } else if (ratio > 2) {
                setAspectRatio(2); // Very wide videos
            } else {
                setAspectRatio(ratio);
            }
            setIsLoading(false);
        } else if (videoPath) {
            // Fallback to video element if dimensions not provided
            const video = document.createElement('video');
            video.src = videoPath;
            video.onloadedmetadata = () => {
                const ratio = video.videoWidth / video.videoHeight;
                // Limit extreme aspect ratios
                if (ratio < 0.5) {
                    setAspectRatio(0.5);
                } else if (ratio > 2) {
                    setAspectRatio(2);
                } else {
                    setAspectRatio(ratio);
                }
                setIsLoading(false);
            };
        } else {
            setIsLoading(false);
        }
    }, [videoPath, width, height]);

    if (isLoading) {
        return (
            <div className={`w-full bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <VideoIcon className="w-8 h-8 text-gray-400 animate-pulse" />
            </div>
        );
    }

    if (!src) {
        return (
            <div className={`w-full bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <VideoIcon className="w-8 h-8 text-gray-400" />
            </div>
        );
    }

    return (
        <div
            className={`w-full bg-gray-100 rounded-lg overflow-hidden ${className}`}
            style={{
                aspectRatio: aspectRatio,
                maxHeight: '240px'
            }}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
            />
        </div>
    );
}