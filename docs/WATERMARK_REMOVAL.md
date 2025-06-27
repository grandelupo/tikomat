# Watermark Removal Feature

This feature provides automatic watermark detection and removal from videos using AI-powered techniques and FFmpeg processing. The system has been enhanced to specifically handle Sora, TikTok, and custom watermarks with improved accuracy.

## Enhanced Features

- **Platform-Specific Detection**: Optimized detection for TikTok, Sora, and custom watermarks
- **Advanced Pattern Recognition**: Text and logo pattern analysis with OCR-like capabilities
- **Machine Learning Integration**: Template learning and confidence adjustment
- **Improved Removal Methods**: Platform-specific removal strategies
- **One-Click Removal**: "Find and Remove Watermarks" button with enhanced detection
- **Real-time Processing**: Background job processing with progress tracking
- **Quality Assessment**: Post-processing quality analysis and reporting

## Platform Support

### TikTok Watermarks
- Detects TikTok logos and text overlays
- Recognizes TikTok brand colors (#FE2C55, #25F4EE)
- Handles common TikTok watermark positions
- Uses inpainting method for optimal removal

### Sora Watermarks
- Identifies Sora AI-generated content watermarks
- Detects "Made with Sora" and similar text
- Handles complex AI-generated watermarks
- Uses temporal coherence for moving watermarks

### Custom Watermarks
- Learns from user-provided examples
- Creates custom detection templates
- Adapts to new watermark patterns
- Improves detection accuracy over time

## How to Use

### From the Video Editor

1. Navigate to any video in your video editor (`/videos/{id}/edit`)
2. In the "Watermark Removal" section, click the **"Find and Remove Watermarks"** button
3. The enhanced system will:
   - Automatically scan your video for watermarks using platform-specific templates
   - Detect watermark locations, types, and platforms
   - Apply optimal removal methods based on watermark characteristics
   - Provide detailed progress updates during processing
   - Learn from successful detections for future improvements
4. Once complete, you'll receive a success notification and the processed video

### Advanced Options

Before clicking "Find and Remove Watermarks", you can expand the "Advanced Options" section to configure:

- **Detection Sensitivity**: 
  - Low: Fast detection for obvious watermarks
  - Medium: Balanced detection (default)
  - High: Thorough detection for subtle watermarks

- **Detection Mode**:
  - Fast: Quick analysis for time-sensitive processing
  - Balanced: Optimal speed and accuracy (default)
  - Thorough: Comprehensive analysis for maximum accuracy

- **Platform Focus**:
  - All: Detect all platform watermarks (default)
  - TikTok: Focus on TikTok-specific watermarks
  - Sora: Focus on Sora AI watermarks
  - Custom: Focus on custom/unknown watermarks

- **Learning Mode**:
  - Enable: Learn from detections to improve future accuracy (default)
  - Disable: Use existing templates only

- **Removal Method**:
  - AI Inpainting: Most accurate, slower processing
  - Content-Aware Fill: Good quality, medium speed
  - Temporal Coherence: Best for moving watermarks
  - Frequency Domain: Fastest processing
  - Template Matching: Platform-specific removal

## API Endpoints

### Enhanced Watermark Detection
```http
POST /ai/watermark-detect
Content-Type: application/json

{
    "video_path": "videos/sample.mp4",
    "sensitivity": "medium",
    "detection_mode": "thorough",
    "enable_learning": true,
    "platform_focus": "all"
}
```

### Remove Watermarks
```http
POST /ai/watermark-remove
Content-Type: application/json

{
    "video_path": "videos/sample.mp4",
    "watermarks": [
        {
            "id": "wm_123",
            "type": "logo",
            "platform": "tiktok",
            "confidence": 95,
            "location": {
                "x": 100,
                "y": 100,
                "width": 200,
                "height": 100
            }
        }
    ],
    "method": "inpainting",
    "quality_preset": "high"
}
```

### Get Removal Progress
```http
POST /ai/watermark-progress
Content-Type: application/json

{
    "removal_id": "removal_123"
}
```

### Watermark Template Management
```http
POST /ai/watermark-template-create
Content-Type: application/json

{
    "name": "Custom Logo Template",
    "properties": {
        "size_ratio": 0.15,
        "position": "bottom-right",
        "confidence_threshold": 75,
        "removal_difficulty": "medium"
    },
    "patterns": {
        "color_patterns": {
            "dominant_colors": ["#000000", "#FFFFFF"],
            "color_variance": 50,
            "transparency_level": 0.5
        }
    }
}
```

### Get Detection Statistics
```http
GET /ai/watermark-detection-stats
```

## Detection Results

The enhanced detection system provides detailed information about detected watermarks:

```json
{
    "detection_id": "detect_123",
    "processing_status": "completed",
    "detected_watermarks": [
        {
            "id": "wm_123",
            "type": "logo",
            "platform": "tiktok",
            "confidence": 95,
            "location": {
                "x": 100,
                "y": 100,
                "width": 200,
                "height": 100
            },
            "properties": {
                "removal_method": "inpainting",
                "difficulty": "medium"
            },
            "temporal_consistency": 90,
            "removal_difficulty": "medium",
            "frames_detected": 150,
            "detection_method": "platform_template"
        }
    ],
    "analysis_confidence": 92.5,
    "platform_breakdown": {
        "tiktok": {
            "count": 2,
            "confidence_avg": 94.5,
            "types": ["logo", "text_overlay"]
        },
        "sora": {
            "count": 1,
            "confidence_avg": 88.0,
            "types": ["logo"]
        }
    },
    "detection_stats": {
        "total_templates": 15,
        "platform_templates": 3,
        "custom_templates": 12,
        "total_detections": 150,
        "successful_detections": 142
    }
}
```

## Removal Progress

Track the progress of watermark removal:

```json
{
    "removal_id": "removal_123",
    "processing_status": "processing",
    "progress": {
        "current_step": "processing",
        "percentage": 65,
        "estimated_time": 120,
        "frames_processed": 1300,
        "total_frames": 2000
    },
    "removal_results": [
        {
            "watermark_id": "wm_123",
            "removal_success": true,
            "confidence": 95,
            "method_used": "inpainting",
            "processing_time": 45,
            "quality_impact": 3,
            "artifacts_detected": 0
        }
    ]
}
```

## Quality Assessment

After removal, the system provides quality assessment:

```json
{
    "analysis_id": "qual_123",
    "quality_metrics": {
        "overall_score": 94,
        "visual_quality": 96,
        "artifact_detection": 8,
        "edge_preservation": 95,
        "color_consistency": 93,
        "temporal_stability": 92
    },
    "watermark_removal_effectiveness": {
        "complete_removal": 95,
        "partial_removal": 3,
        "failed_removal": 2,
        "artifacts_introduced": 8
    }
}
```

## Performance Optimization

### Frame Sampling
- Samples frames every 2 seconds for efficient processing
- Maintains detection accuracy while reducing processing time
- Configurable sampling based on video length and quality

### Parallel Processing
- Processes multiple watermarks simultaneously
- Uses FFmpeg filter chains for efficient removal
- Background job processing for long videos

### Caching
- Caches detection results for 30 days
- Stores templates in memory for fast access
- Reduces redundant processing

## Troubleshooting

### Common Issues

1. **Low Detection Confidence**
   - Increase sensitivity to "high"
   - Use "thorough" detection mode
   - Enable learning for better future detection
   - Check video quality and resolution

2. **Missing Watermarks**
   - Verify watermark is in expected positions
   - Try platform-specific focus
   - Check if watermark is too small or transparent
   - Use "thorough" detection mode

3. **Poor Removal Quality**
   - Use "inpainting" method for complex watermarks
   - Enable "temporal_coherence" for moving watermarks
   - Check video resolution and quality
   - Try different removal methods

### Debug Information
```javascript
// Get detailed detection statistics
const stats = await fetch('/ai/watermark-detection-stats');
const statsData = await stats.json();
console.log('Detection Stats:', statsData.data);
```

## Enhanced Documentation

For detailed information about the enhanced watermark detection system, including platform-specific templates, machine learning integration, and advanced usage examples, see:

**[Enhanced Watermark Detection Documentation](./ENHANCED_WATERMARK_DETECTION.md)**

## Support

The enhanced watermark detection system provides significantly improved accuracy for Sora, TikTok, and custom watermarks while maintaining high performance and user-friendly operation. For issues or questions:

1. Check the troubleshooting section above
2. Review detection statistics for insights
3. Create custom templates for specific watermarks
4. Contact support with detailed error information 