# Watermark Cutout Images API

This document explains how the watermark detection now includes cutout images for frontend display.

## Overview

When watermarks are detected in a video, the system now automatically generates small cutout images showing the exact detected watermark regions. These images are saved in `public/watermark-cutouts/` and can be displayed in the frontend UI.

## API Response Structure

When calling the watermark detection endpoint, each detected watermark now includes additional fields:

```json
{
  "success": true,
  "data": {
    "detection_id": "detect_123456789",
    "processing_status": "completed",
    "detected_watermarks": [
      {
        "id": "wm_123456789",
        "type": "logo",
        "platform": "tiktok",
        "confidence": 85,
        "display_name": "Tiktok Logo",
        "location": {
          "x": 10,
          "y": 800,
          "width": 100,
          "height": 150
        },
        "cutout_image": "/watermark-cutouts/watermark_wm_123456789_1720603200.png",
        "cutout_path": "/full/path/to/cutout.png",
        "detection_method": "platform_template",
        "removal_difficulty": "medium",
        "temporal_consistency": 90,
        "frames_detected": 100
      }
    ],
    "detection_metadata": {
      "cutouts_generated": 4
    }
  }
}
```

## Frontend Integration

### Display Watermarks with Images

```html
<!-- Example HTML structure -->
<div class="watermark-results">
  <h3>Detected Watermarks</h3>
  
  <div v-for="watermark in detectedWatermarks" :key="watermark.id" class="watermark-item">
    <!-- Watermark cutout image -->
    <div class="watermark-preview">
      <img 
        v-if="watermark.cutout_image" 
        :src="watermark.cutout_image" 
        :alt="watermark.display_name"
        class="watermark-cutout"
        @error="handleImageError"
      />
      <div v-else class="no-preview">
        <span>No preview available</span>
      </div>
    </div>
    
    <!-- Watermark info -->
    <div class="watermark-info">
      <h4>{{ watermark.display_name }}</h4>
      <p class="confidence">{{ watermark.confidence }}% confidence</p>
      <p class="platform">Platform: {{ watermark.platform }}</p>
      <p class="location">
        Location: ({{ watermark.location.x }}, {{ watermark.location.y }})
        {{ watermark.location.width }}×{{ watermark.location.height }}
      </p>
    </div>
    
    <!-- Removal status (if applicable) -->
    <div class="removal-status">
      <span class="status-badge success">✓ Successfully removed</span>
      <span class="confidence">95% confidence</span>
    </div>
  </div>
</div>
```

### CSS Styling

```css
.watermark-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #f8fafc;
}

.watermark-preview {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  margin-right: 16px;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d1d5db;
}

.watermark-cutout {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
}

.watermark-info {
  flex-grow: 1;
}

.watermark-info h4 {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #1f2937;
}

.watermark-info p {
  margin: 2px 0;
  font-size: 14px;
  color: #6b7280;
}

.removal-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}
```

### JavaScript/Vue.js Implementation

```javascript
// Example Vue.js component
export default {
  data() {
    return {
      detectedWatermarks: [],
      loading: false
    }
  },
  
  methods: {
    async detectWatermarks(videoPath) {
      this.loading = true;
      
      try {
        const response = await fetch('/ai/watermark-detect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({
            video_path: videoPath,
            options: {
              method: 'inpainting'
            }
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.detectedWatermarks = data.data.detected_watermarks;
        }
      } catch (error) {
        console.error('Watermark detection failed:', error);
      } finally {
        this.loading = false;
      }
    },
    
    handleImageError(event) {
      // Handle case where cutout image fails to load
      event.target.style.display = 'none';
      event.target.parentNode.innerHTML = '<div class="no-preview"><span>Preview unavailable</span></div>';
    }
  }
}
```

## Features

### Cutout Image Details
- **Size**: Watermark region + 10px padding on all sides
- **Border**: Red 2px border highlighting the exact watermark area
- **Format**: PNG with transparency support
- **Naming**: `watermark_{watermark_id}_{timestamp}.png`

### Automatic Cleanup
- Cutout images are automatically cleaned up after 24 hours
- Manual cleanup: `php artisan watermark:cleanup-cutouts --hours=6`
- Scheduled cleanup runs daily at 3:00 AM

### Error Handling
- If cutout generation fails, the watermark data still includes all other information
- Frontend should gracefully handle missing `cutout_image` field
- Images are served from the public directory for fast access

## Testing

Test the cutout generation with a specific region:

```bash
# Test specific TikTok watermark area
curl -X POST "http://your-app.com/ai/watermark-test-tiktok" \
  -H "Content-Type: application/json" \
  -d '{"video_path": "private/videos/your-video.mp4"}'

# Test custom region
curl -X POST "http://your-app.com/ai/watermark-test-region" \
  -H "Content-Type: application/json" \
  -d '{
    "video_path": "private/videos/your-video.mp4",
    "x": 10,
    "y": 800,
    "width": 100,
    "height": 150
  }'
```

## Notes
- Cutout images are temporary and automatically cleaned up
- Images are accessible via direct URL for frontend display
- The system includes fallbacks for when cutout generation fails
- All cutout images are ignored by git (see `public/watermark-cutouts/.gitignore`) 