<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Models\Video;
use App\Jobs\ProcessSubtitleGeneration;

class AISubtitleGeneratorService
{
    private $subtitleStyles = [
        'simple' => [
            'name' => 'Simple Text',
            'description' => 'Clean, readable text with minimal styling',
            'properties' => [
                'font_family' => 'Arial, sans-serif',
                'font_size' => '24px',
                'font_weight' => 'bold',
                'color' => '#FFFFFF',
                'background' => 'rgba(0, 0, 0, 0.7)',
                'padding' => '8px 16px',
                'border_radius' => '4px',
                'text_align' => 'center'
            ]
        ],
        'modern' => [
            'name' => 'Modern',
            'description' => 'Sleek design with subtle shadows and gradients',
            'properties' => [
                'font_family' => 'Montserrat, sans-serif',
                'font_size' => '26px',
                'font_weight' => '600',
                'color' => '#FFFFFF',
                'background' => 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(32, 32, 32, 0.8))',
                'padding' => '12px 20px',
                'border_radius' => '12px',
                'text_shadow' => '2px 2px 4px rgba(0, 0, 0, 0.5)',
                'text_align' => 'center'
            ]
        ],
        'neon' => [
            'name' => 'Neon Glow',
            'description' => 'Bright neon effect with glowing edges',
            'properties' => [
                'font_family' => 'Orbitron, monospace',
                'font_size' => '28px',
                'font_weight' => 'bold',
                'color' => '#00FFFF',
                'background' => 'rgba(0, 0, 0, 0.9)',
                'padding' => '10px 18px',
                'border_radius' => '8px',
                'text_shadow' => '0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 30px #00FFFF',
                'border' => '2px solid #00FFFF',
                'text_align' => 'center'
            ]
        ],
        'typewriter' => [
            'name' => 'Typewriter',
            'description' => 'Characters appear one by one like typing',
            'properties' => [
                'font_family' => 'Courier New, monospace',
                'font_size' => '24px',
                'font_weight' => 'normal',
                'color' => '#FFFFFF',
                'background' => 'rgba(0, 0, 0, 0.8)',
                'padding' => '8px 16px',
                'border_radius' => '0px',
                'animation' => 'typewriter',
                'text_align' => 'left'
            ]
        ],
        'bounce' => [
            'name' => 'Bounce',
            'description' => 'Words bounce in with elastic animation',
            'properties' => [
                'font_family' => 'Comic Sans MS, cursive',
                'font_size' => '30px',
                'font_weight' => 'bold',
                'color' => '#FFD700',
                'background' => 'rgba(255, 20, 147, 0.8)',
                'padding' => '12px 24px',
                'border_radius' => '20px',
                'animation' => 'bounce',
                'text_align' => 'center'
            ]
        ],
        'confetti' => [
            'name' => 'Confetti',
            'description' => 'Colorful animated confetti particles around text',
            'properties' => [
                'font_family' => 'Fredoka One, cursive',
                'font_size' => '32px',
                'font_weight' => 'normal',
                'color' => '#FFFFFF',
                'background' => 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
                'padding' => '16px 32px',
                'border_radius' => '25px',
                'animation' => 'confetti',
                'text_align' => 'center',
                'particles' => true
            ]
        ],
        'glass' => [
            'name' => 'Glass Effect',
            'description' => 'Translucent glass morphism style',
            'properties' => [
                'font_family' => 'Inter, sans-serif',
                'font_size' => '26px',
                'font_weight' => '500',
                'color' => '#FFFFFF',
                'background' => 'rgba(255, 255, 255, 0.1)',
                'padding' => '14px 28px',
                'border_radius' => '16px',
                'backdrop_filter' => 'blur(10px)',
                'border' => '1px solid rgba(255, 255, 255, 0.2)',
                'text_align' => 'center'
            ]
        ]
    ];

    private $positionPresets = [
        'bottom_center' => ['x' => 50, 'y' => 85, 'name' => 'Bottom Center'],
        'bottom_left' => ['x' => 10, 'y' => 85, 'name' => 'Bottom Left'],
        'bottom_right' => ['x' => 90, 'y' => 85, 'name' => 'Bottom Right'],
        'top_center' => ['x' => 50, 'y' => 15, 'name' => 'Top Center'],
        'top_left' => ['x' => 10, 'y' => 15, 'name' => 'Top Left'],
        'top_right' => ['x' => 90, 'y' => 15, 'name' => 'Top Right'],
        'center' => ['x' => 50, 'y' => 50, 'name' => 'Center'],
        'center_left' => ['x' => 10, 'y' => 50, 'name' => 'Center Left'],
        'center_right' => ['x' => 90, 'y' => 50, 'name' => 'Center Right']
    ];

    public function generateSubtitles(string $videoPath, array $options = [])
    {
        try {
            $videoId = $options['video_id'] ?? null;
            $video = null;
            
            // If video ID is provided, check if subtitles already exist
            if ($videoId) {
                $video = \App\Models\Video::find($videoId);
                if ($video && $video->hasSubtitles()) {
                    Log::info('Returning existing subtitles for video: ' . $videoId);
                    // Return existing subtitle data
                    return [
                        'generation_id' => $video->subtitle_generation_id,
                        'processing_status' => 'completed',
                        'subtitles' => $video->subtitle_data['subtitles'] ?? [],
                        'language' => $video->subtitle_language,
                        'srt_file' => $video->subtitle_file_path,
                        'created_at' => $video->subtitles_generated_at,
                        'video_path' => $videoPath,
                    ];
                }
            }

            $generationId = uniqid('sub_gen_');
            Log::info('Starting real subtitle generation: ' . $generationId, ['video_path' => $videoPath]);

            // Validate video file exists
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found at path: ' . $videoPath);
            }

            // Update video status if video ID provided
            if ($video) {
                $video->update([
                    'subtitle_generation_id' => $generationId,
                    'subtitle_status' => 'processing',
                    'subtitle_language' => $options['language'] ?? 'en',
                ]);
            }

            // Initialize generation state
            $generation = [
                'generation_id' => $generationId,
                'video_path' => $videoPath,
                'video_id' => $videoId,
                'processing_status' => 'processing',
                'language' => $options['language'] ?? 'en',
                'style' => $options['style'] ?? 'simple',
                'position' => $options['position'] ?? 'bottom_center',
                'progress' => [
                    'current_step' => 'audio_extraction',
                    'percentage' => 5,
                    'estimated_time' => $this->estimateGenerationTime($videoPath),
                    'processed_duration' => 0,
                    'total_duration' => $this->getVideoDuration($videoPath)
                ],
                'subtitles' => [],
                'audio_file' => null,
                'srt_file' => null,
                'processed_video' => null
            ];

            // Cache the initial state
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200); // 2 hours

            // Start background processing using job queue
            ProcessSubtitleGeneration::dispatch($generationId, $videoPath, $options);

            return $generation;

        } catch (\Exception $e) {
            Log::error('Subtitle generation failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function processSubtitlesInBackground(string $generationId, string $videoPath, array $options)
    {
        try {
            // Step 1: Extract audio from video
            $this->updateProgress($generationId, 'audio_extraction', 10);
            $audioPath = $this->extractAudio($videoPath);
            
            // Step 2: Transcribe audio using OpenAI Whisper
            $this->updateProgress($generationId, 'transcription', 30);
            $transcription = $this->transcribeAudio($audioPath, $options['language'] ?? 'en');
            
            // Step 3: Process transcription into subtitle format
            $this->updateProgress($generationId, 'subtitle_processing', 60);
            $subtitles = $this->processTranscription($transcription);
            
            // Step 4: Generate SRT file
            $this->updateProgress($generationId, 'file_generation', 80);
            $srtPath = $this->generateSRTFile($subtitles, $generationId);
            
            // Step 5: Generate word timing file
            $this->updateProgress($generationId, 'word_timing_generation', 90);
            $wordTimingPath = $this->generateWordTimingFile($subtitles, $generationId);
            
            // Step 6: Complete processing
            $this->updateProgress($generationId, 'completed', 100);
            
            // Update final result
            $generation = Cache::get("subtitle_generation_{$generationId}");
            $generation['processing_status'] = 'completed';
            $generation['subtitles'] = $subtitles;
            $generation['audio_file'] = $audioPath;
            $generation['srt_file'] = $srtPath;
            $generation['word_timing_file'] = $wordTimingPath;
            $generation['style_config'] = $this->subtitleStyles[$options['style'] ?? 'simple'];
            $generation['position_config'] = $this->positionPresets[$options['position'] ?? 'bottom_center'];
            
            // Save to database if video ID provided
            if (isset($generation['video_id']) && $generation['video_id']) {
                $video = \App\Models\Video::find($generation['video_id']);
                if ($video) {
                    $video->update([
                        'subtitle_status' => 'completed',
                        'subtitle_file_path' => $srtPath,
                        'subtitle_data' => [
                            'generation_id' => $generationId,
                            'subtitles' => $subtitles,
                            'language' => $generation['language'],
                            'style' => $generation['style'],
                            'position' => $generation['position'],
                            'word_timing_file' => $wordTimingPath,
                        ],
                        'subtitles_generated_at' => now(),
                    ]);
                }
            }
            
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
            
            Log::info('Subtitle generation completed: ' . $generationId);
            
        } catch (\Exception $e) {
            Log::error('Subtitle processing failed: ' . $e->getMessage(), [
                'generation_id' => $generationId,
                'video_path' => $videoPath
            ]);
            
            // Mark as failed
            $generation = Cache::get("subtitle_generation_{$generationId}");
            $generation['processing_status'] = 'failed';
            $generation['error'] = $e->getMessage();
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
        }
    }

    private function extractAudio(string $videoPath): string
    {
        $audioPath = storage_path('app/temp/audio_' . Str::random(10) . '.wav');
        
        // Create temp directory if it doesn't exist
        if (!is_dir(dirname($audioPath))) {
            mkdir(dirname($audioPath), 0755, true);
        }
        
        // Use FFmpeg to extract audio
        $command = sprintf(
            'ffmpeg -i %s -acodec pcm_s16le -ac 1 -ar 16000 %s 2>&1',
            escapeshellarg($videoPath),
            escapeshellarg($audioPath)
        );
        
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($audioPath)) {
            throw new \Exception('Failed to extract audio from video. FFmpeg error: ' . implode(' ', $output));
        }
        
        Log::info('Audio extracted successfully', ['audio_path' => $audioPath]);
        return $audioPath;
    }

    private function transcribeAudio(string $audioPath, string $language): array
    {
        $apiKey = config('openai.api_key');
        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured');
        }

        try {
            // Use cURL for the OpenAI Whisper API transcription
            $curl = curl_init();
            
            curl_setopt_array($curl, [
                CURLOPT_URL => 'https://api.openai.com/v1/audio/transcriptions',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $apiKey,
                ],
                CURLOPT_POSTFIELDS => [
                    'file' => new \CURLFile($audioPath, 'audio/wav', basename($audioPath)),
                    'model' => 'whisper-1',
                    'language' => $language,
                    'response_format' => 'verbose_json',
                    'timestamp_granularities[]' => 'word',
                    'timestamp_granularities[]' => 'segment'
                ],
                CURLOPT_TIMEOUT => 300, // 5 minutes timeout
            ]);
            
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $error = curl_error($curl);
            curl_close($curl);
            
            if ($error) {
                throw new \Exception('cURL error: ' . $error);
            }
            
            if ($httpCode !== 200) {
                Log::error('OpenAI API error', [
                    'status' => $httpCode,
                    'body' => $response
                ]);
                throw new \Exception('OpenAI API error (HTTP ' . $httpCode . '): ' . $response);
            }

            $transcription = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid JSON response from OpenAI API: ' . json_last_error_msg());
            }
            
            // Debug: Log the complete OpenAI response to understand word timing data
            Log::info('OpenAI Whisper API Response', [
                'duration' => $transcription['duration'] ?? 'unknown',
                'language' => $transcription['language'] ?? 'unknown',
                'segments_count' => count($transcription['segments'] ?? []),
                'has_words' => isset($transcription['words']),
                'words_count' => isset($transcription['words']) ? count($transcription['words']) : 0,
                'first_segment_has_words' => isset($transcription['segments'][0]['words']) ? count($transcription['segments'][0]['words']) : 0,
                'sample_segment' => $transcription['segments'][0] ?? null,
                'sample_words' => isset($transcription['words']) ? array_slice($transcription['words'], 0, 5) : 'none',
            ]);
            
            // Clean up audio file
            if (file_exists($audioPath)) {
                unlink($audioPath);
            }
            
            Log::info('Audio transcription completed', [
                'duration' => $transcription['duration'] ?? 'unknown',
                'language' => $transcription['language'] ?? 'unknown'
            ]);
            
            return $transcription;
            
        } catch (\Exception $e) {
            // Clean up audio file on error
            if (file_exists($audioPath)) {
                unlink($audioPath);
            }
            throw $e;
        }
    }

    private function processTranscription(array $transcription): array
    {
        $subtitles = [];
        $segments = $transcription['segments'] ?? [];
        $globalWords = $transcription['words'] ?? [];

        // Create a map of global words by start time for easier lookup
        $wordMap = [];
        foreach ($globalWords as $wordData) {
            $startTime = $wordData['start'] ?? 0;
            $wordMap[$startTime] = [
                'word' => $wordData['word'] ?? '',
                'start_time' => $wordData['start'] ?? 0,
                'end_time' => $wordData['end'] ?? 0,
                'confidence' => $wordData['probability'] ?? 0.9
            ];
        }

        foreach ($segments as $index => $segment) {
            $words = [];
            
            // First try to get words from segment
            if (isset($segment['words']) && !empty($segment['words'])) {
                foreach ($segment['words'] as $wordData) {
                    $words[] = [
                        'word' => $wordData['word'] ?? '',
                        'start_time' => $wordData['start'] ?? 0,
                        'end_time' => $wordData['end'] ?? 0,
                        'confidence' => $wordData['probability'] ?? 0.9
                    ];
                }
            } else {
                // Fallback: extract words from global words array that fall within this segment's time range
                $segmentStart = $segment['start'] ?? 0;
                $segmentEnd = $segment['end'] ?? 0;
                
                foreach ($globalWords as $wordData) {
                    $wordStart = $wordData['start'] ?? 0;
                    $wordEnd = $wordData['end'] ?? 0;
                    
                    // Check if word falls within this segment
                    if ($wordStart >= $segmentStart && $wordEnd <= $segmentEnd) {
                        $words[] = [
                            'word' => $wordData['word'] ?? '',
                            'start_time' => $wordData['start'] ?? 0,
                            'end_time' => $wordData['end'] ?? 0,
                            'confidence' => $wordData['probability'] ?? 0.9
                        ];
                    }
                }
            }

            $subtitle = [
                'id' => uniqid('sub_'),
                'index' => $index + 1,
                'start_time' => $segment['start'] ?? 0,
                'end_time' => $segment['end'] ?? 0,
                'duration' => ($segment['end'] ?? 0) - ($segment['start'] ?? 0),
                'text' => trim($segment['text'] ?? ''),
                'words' => $words,
                'confidence' => $segment['avg_logprob'] ?? 0.9,
                'position' => ['x' => 50, 'y' => 85],
                'style' => $this->getDefaultSubtitleStyle(),
                'no_speech_prob' => $segment['no_speech_prob'] ?? 0
            ];
            
            // Debug: Log subtitle processing
            Log::info('Processing subtitle segment', [
                'index' => $index,
                'text' => $subtitle['text'],
                'words_count' => count($words),
                'has_word_timing' => !empty($words),
                'sample_words' => array_slice($words, 0, 3), // First 3 words
            ]);
            
            $subtitles[] = $subtitle;
        }

        return $subtitles;
    }

    private function generateSRTFile(array $subtitles, string $generationId): string
    {
        $srtPath = storage_path('app/subtitles/subtitle_' . $generationId . '.srt');
        
        // Create subtitles directory if it doesn't exist
        if (!is_dir(dirname($srtPath))) {
            mkdir(dirname($srtPath), 0755, true);
        }
        
        $srtContent = '';
        
        foreach ($subtitles as $subtitle) {
            $startTime = $this->formatSRTTime($subtitle['start_time']);
            $endTime = $this->formatSRTTime($subtitle['end_time']);
            
            $srtContent .= $subtitle['index'] . "\n";
            $srtContent .= $startTime . ' --> ' . $endTime . "\n";
            $srtContent .= $subtitle['text'] . "\n\n";
        }
        
        file_put_contents($srtPath, $srtContent);
        
        Log::info('SRT file generated', ['srt_path' => $srtPath]);
        return $srtPath;
    }

    private function generateWordTimingFile(array $subtitles, string $generationId): string
    {
        $wordTimingPath = storage_path('app/subtitles/words_' . $generationId . '.json');
        
        // Create subtitles directory if it doesn't exist
        if (!is_dir(dirname($wordTimingPath))) {
            mkdir(dirname($wordTimingPath), 0755, true);
        }
        
        $allWords = [];
        
        foreach ($subtitles as $subtitle) {
            $subtitleId = $subtitle['id'];
            $words = $subtitle['words'] ?? [];
            
            foreach ($words as $wordData) {
                $allWords[] = [
                    'subtitle_id' => $subtitleId,
                    'word' => $wordData['word'],
                    'start_time' => $wordData['start_time'],
                    'end_time' => $wordData['end_time'],
                    'confidence' => $wordData['confidence'],
                    'subtitle_text' => $subtitle['text'],
                    'subtitle_start' => $subtitle['start_time'],
                    'subtitle_end' => $subtitle['end_time'],
                ];
            }
        }
        
        // Save as JSON for easy frontend consumption
        $wordTimingData = [
            'generation_id' => $generationId,
            'created_at' => now()->toISOString(),
            'total_words' => count($allWords),
            'words' => $allWords
        ];
        
        file_put_contents($wordTimingPath, json_encode($wordTimingData, JSON_PRETTY_PRINT));
        
        Log::info('Word timing file generated', [
            'word_timing_path' => $wordTimingPath,
            'total_words' => count($allWords)
        ]);
        
        return $wordTimingPath;
    }

    public function applySubtitlesToVideo(string $generationId): array
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Subtitle generation must be completed first');
            }

            if (!isset($generation['srt_file']) || !file_exists($generation['srt_file'])) {
                throw new \Exception('SRT file not found');
            }

            $videoPath = $generation['video_path'];
            $srtPath = $generation['srt_file'];
            $style = $generation['style'] ?? 'simple';
            $position = $generation['position'] ?? 'bottom_center';
            
            // Generate output video path
            $outputPath = $this->generateOutputVideoPath($generationId);
            
            // Apply subtitles to video using FFmpeg
            $processedVideoPath = $this->burnSubtitlesIntoVideo(
                $videoPath, 
                $srtPath, 
                $outputPath, 
                $style, 
                $position
            );
            
            // Update generation data
            $generation['processed_video'] = $processedVideoPath;
            $generation['video_with_subtitles'] = $processedVideoPath;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
            
            return [
                'success' => true,
                'processed_video_path' => $processedVideoPath,
                'original_video_path' => $videoPath,
                'srt_file_path' => $srtPath,
                'download_url' => $this->generateDownloadUrl($processedVideoPath)
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to apply subtitles to video: ' . $e->getMessage());
            throw $e;
        }
    }

    private function burnSubtitlesIntoVideo(string $videoPath, string $srtPath, string $outputPath, string $style, string $position): string
    {
        // Create output directory if needed
        if (!is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        // Get style configuration
        $styleConfig = $this->subtitleStyles[$style] ?? $this->subtitleStyles['simple'];
        $positionConfig = $this->positionPresets[$position] ?? $this->positionPresets['bottom_center'];
        
        // Convert style to FFmpeg subtitle filter
        $subtitleFilter = $this->buildFFmpegSubtitleFilter($styleConfig, $positionConfig);
        
        // Build FFmpeg command
        $command = sprintf(
            'ffmpeg -i %s -vf "subtitles=%s%s" -c:a copy %s 2>&1',
            escapeshellarg($videoPath),
            escapeshellarg($srtPath),
            $subtitleFilter,
            escapeshellarg($outputPath)
        );
        
        Log::info('Burning subtitles into video', ['command' => $command]);
        
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        if ($returnCode !== 0 || !file_exists($outputPath)) {
            throw new \Exception('Failed to burn subtitles into video. FFmpeg error: ' . implode(' ', $output));
        }
        
        Log::info('Subtitles burned into video successfully', ['output_path' => $outputPath]);
        return $outputPath;
    }

    private function buildFFmpegSubtitleFilter(array $styleConfig, array $positionConfig): string
    {
        $properties = $styleConfig['properties'];
        
        // Extract style properties and convert to FFmpeg subtitle filter format
        $fontSize = intval(str_replace('px', '', $properties['font_size'] ?? '24'));
        $fontColor = str_replace('#', '', $properties['color'] ?? 'FFFFFF');
        $backgroundColor = 'black@0.7'; // Default background
        
        // Position calculation (FFmpeg uses different coordinate system)
        $x = ($positionConfig['x'] / 100) * 'main_w - text_w';
        $y = ($positionConfig['y'] / 100) * 'main_h - text_h';
        
        return sprintf(
            ':force_style=\'FontSize=%d,PrimaryColour=&H%s,BackColour=&H%s,Bold=1,Alignment=2\'',
            $fontSize,
            $fontColor,
            '000000'
        );
    }

    private function generateOutputVideoPath(string $generationId): string
    {
        return storage_path('app/videos/processed/video_with_subtitles_' . $generationId . '.mp4');
    }

    private function generateDownloadUrl(string $filePath): string
    {
        // Handle subtitle files in the subtitles directory
        if (strpos($filePath, '/subtitles/') !== false) {
            $relativePath = str_replace(storage_path('app/'), '', $filePath);
            return url('storage/' . $relativePath);
        }
        
        // For other files, use the standard storage path
        $relativePath = str_replace(storage_path('app/'), '', $filePath);
        return url('storage/' . $relativePath);
    }

    private function formatSRTTime(float $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;
        $milliseconds = ($secs - floor($secs)) * 1000;
        
        return sprintf(
            '%02d:%02d:%02d,%03d',
            $hours,
            $minutes,
            floor($secs),
            round($milliseconds)
        );
    }

    private function getVideoDuration(string $videoPath): float
    {
        $command = sprintf(
            'ffprobe -v quiet -show_entries format=duration -of csv="p=0" %s',
            escapeshellarg($videoPath)
        );
        
        $duration = exec($command);
        return floatval($duration) ?: 0;
    }

    private function updateProgress(string $generationId, string $step, int $percentage)
    {
        $generation = Cache::get("subtitle_generation_{$generationId}");
        if ($generation) {
            $generation['progress']['current_step'] = $step;
            $generation['progress']['percentage'] = $percentage;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
        }
    }

    private function analyzeTranscriptionQuality(array $subtitles): array
    {
        $totalConfidence = 0;
        $totalWords = 0;
        $totalSegments = count($subtitles);
        
        foreach ($subtitles as $subtitle) {
            $totalConfidence += $subtitle['confidence'] ?? 0;
            $totalWords += count(explode(' ', $subtitle['text']));
        }
        
        $avgConfidence = $totalSegments > 0 ? $totalConfidence / $totalSegments : 0;
        $avgWordsPerSegment = $totalSegments > 0 ? $totalWords / $totalSegments : 0;
        
        return [
            'accuracy_score' => round($avgConfidence * 100, 2),
            'timing_precision' => rand(88, 97), // Placeholder - could be calculated from word timings
            'word_recognition' => round($avgConfidence * 100, 2),
            'total_segments' => $totalSegments,
            'total_words' => $totalWords,
            'avg_words_per_segment' => round($avgWordsPerSegment, 1),
            'avg_confidence' => round($avgConfidence, 3)
        ];
    }

    private function estimateGenerationTime(string $videoPath): int
    {
        $duration = $this->getVideoDuration($videoPath);
        // Estimate: 30% of video duration for processing
        return round($duration * 0.3);
    }

    public function getGenerationProgress(string $generationId)
    {
        // First check cache
        $cached = Cache::get("subtitle_generation_{$generationId}");
        if ($cached) {
            return $cached;
        }

        // Then check database for completed subtitles
        $video = \App\Models\Video::where('subtitle_generation_id', $generationId)->first();
        if ($video && $video->hasSubtitles()) {
            $subtitleData = $video->subtitle_data;
            // Handle if subtitle_data is still stored as JSON string
            if (is_string($subtitleData)) {
                $subtitleData = json_decode($subtitleData, true);
            }
            
            // Handle if subtitles within subtitle_data is still a JSON string
            if (isset($subtitleData['subtitles']) && is_string($subtitleData['subtitles'])) {
                $subtitleData['subtitles'] = json_decode($subtitleData['subtitles'], true);
            }
            
            return [
                'generation_id' => $generationId,
                'processing_status' => 'completed',
                'subtitles' => $subtitleData['subtitles'] ?? [],
                'language' => $video->subtitle_language,
                'srt_file' => $video->subtitle_file_path,
                'created_at' => $video->subtitles_generated_at,
                'video_id' => $video->id,
            ];
        }

        return [
            'generation_id' => $generationId,
            'processing_status' => 'not_found',
            'error' => 'Generation process not found'
        ];
    }

    public function updateSubtitleStyle(string $generationId, string $style, array $customProperties = [])
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] === 'not_found') {
                throw new \Exception('Generation not found');
            }

            $styleConfig = $this->subtitleStyles[$style] ?? $this->subtitleStyles['simple'];
            
            if (!empty($customProperties)) {
                $styleConfig['properties'] = array_merge($styleConfig['properties'], $customProperties);
            }

            $generation['style'] = $style;
            $generation['style_config'] = $styleConfig;
            
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
            
            return $generation;

        } catch (\Exception $e) {
            Log::error('Style update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function updateSubtitlePosition(string $generationId, array $position)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] === 'not_found') {
                throw new \Exception('Generation not found');
            }

            $generation['position'] = $position;
            $generation['position_config'] = [
                'x' => $position['x'],
                'y' => $position['y'],
                'name' => 'Custom Position'
            ];
            
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
            
            return $generation;

        } catch (\Exception $e) {
            Log::error('Position update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function exportSubtitles(string $generationId, string $format = 'srt')
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            if ($format === 'srt' && isset($generation['srt_file'])) {
                return [
                    'export_id' => uniqid('export_'),
                    'format' => $format,
                    'file_url' => $this->generateDownloadUrl($generation['srt_file']),
                    'file_path' => $generation['srt_file']
                ];
            }

            // For other formats, convert the SRT file
            $convertedPath = $this->convertSubtitleFormat($generation['srt_file'], $format);
            
            return [
                'export_id' => uniqid('export_'),
                'format' => $format,
                'file_url' => $this->generateDownloadUrl($convertedPath),
                'file_path' => $convertedPath
            ];

        } catch (\Exception $e) {
            Log::error('Export failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function convertSubtitleFormat(string $srtPath, string $format): string
    {
        // Simple conversion - in real implementation, you'd use proper conversion libraries
        $outputPath = str_replace('.srt', '.' . $format, $srtPath);
        
        switch ($format) {
            case 'vtt':
                $this->convertSRTtoVTT($srtPath, $outputPath);
                break;
            case 'ass':
                $this->convertSRTtoASS($srtPath, $outputPath);
                break;
            default:
                throw new \Exception('Unsupported format: ' . $format);
        }
        
        return $outputPath;
    }

    private function convertSRTtoVTT(string $srtPath, string $vttPath)
    {
        $srtContent = file_get_contents($srtPath);
        $vttContent = "WEBVTT\n\n" . str_replace(',', '.', $srtContent);
        file_put_contents($vttPath, $vttContent);
    }

    private function convertSRTtoASS(string $srtPath, string $assPath)
    {
        // Basic ASS conversion - simplified
        $assHeader = "[Script Info]\nTitle: Generated Subtitles\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,20,&Hffffff,&Hffffff,&H0,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
        
        $srtContent = file_get_contents($srtPath);
        // This would need proper SRT to ASS conversion logic
        file_put_contents($assPath, $assHeader . "Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,Converted from SRT\n");
    }

    public function analyzeSubtitleQuality(string $generationId)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            return $generation['quality_metrics'] ?? [];

        } catch (\Exception $e) {
            Log::error('Quality analysis failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getAvailableLanguages()
    {
        return [
            'en' => ['name' => 'English', 'code' => 'en', 'accuracy' => 98],
            'es' => ['name' => 'Spanish', 'code' => 'es', 'accuracy' => 96],
            'fr' => ['name' => 'French', 'code' => 'fr', 'accuracy' => 95],
            'de' => ['name' => 'German', 'code' => 'de', 'accuracy' => 94],
            'it' => ['name' => 'Italian', 'code' => 'it', 'accuracy' => 93],
            'pt' => ['name' => 'Portuguese', 'code' => 'pt', 'accuracy' => 92],
            'ru' => ['name' => 'Russian', 'code' => 'ru', 'accuracy' => 90],
            'ja' => ['name' => 'Japanese', 'code' => 'ja', 'accuracy' => 88],
            'ko' => ['name' => 'Korean', 'code' => 'ko', 'accuracy' => 87],
            'zh' => ['name' => 'Chinese', 'code' => 'zh', 'accuracy' => 89],
            'ar' => ['name' => 'Arabic', 'code' => 'ar', 'accuracy' => 85],
            'hi' => ['name' => 'Hindi', 'code' => 'hi', 'accuracy' => 86]
        ];
    }

    public function getSubtitleStyles()
    {
        return $this->subtitleStyles;
    }

    public function getPositionPresets()
    {
        return $this->positionPresets;
    }

    public function markGenerationAsFailed(string $generationId, string $errorMessage)
    {
        $generation = Cache::get("subtitle_generation_{$generationId}");
        if ($generation) {
            $generation['processing_status'] = 'failed';
            $generation['error'] = $errorMessage;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
        }
    }

    /**
     * Update text of a specific subtitle
     */
    public function updateSubtitleText(string $generationId, string $subtitleId, string $text)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            // Update the subtitle text in the subtitles array
            $subtitles = $generation['subtitles'] ?? [];
            foreach ($subtitles as &$subtitle) {
                if ($subtitle['id'] === $subtitleId) {
                    $subtitle['text'] = $text;
                    break;
                }
            }

            $generation['subtitles'] = $subtitles;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);

            // Regenerate SRT file with updated text
            $this->regenerateSRTFile($generationId, $subtitles);

            return $generation;

        } catch (\Exception $e) {
            Log::error('Subtitle text update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update style of a specific subtitle
     */
    public function updateIndividualSubtitleStyle(string $generationId, string $subtitleId, array $styleUpdates)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            // Update the subtitle style in the subtitles array
            $subtitles = $generation['subtitles'] ?? [];
            foreach ($subtitles as &$subtitle) {
                if ($subtitle['id'] === $subtitleId) {
                    if (!isset($subtitle['style'])) {
                        $subtitle['style'] = $this->getDefaultSubtitleStyle();
                    }
                    $subtitle['style'] = array_merge($subtitle['style'], $styleUpdates);
                    break;
                }
            }

            $generation['subtitles'] = $subtitles;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);

            return $generation;

        } catch (\Exception $e) {
            Log::error('Individual subtitle style update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update position of a specific subtitle
     */
    public function updateIndividualSubtitlePosition(string $generationId, string $subtitleId, array $position)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            // Update the subtitle position in the subtitles array
            $subtitles = $generation['subtitles'] ?? [];
            foreach ($subtitles as &$subtitle) {
                if ($subtitle['id'] === $subtitleId) {
                    $subtitle['position'] = $position;
                    break;
                }
            }

            $generation['subtitles'] = $subtitles;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);

            return $generation;

        } catch (\Exception $e) {
            Log::error('Individual subtitle position update failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Render video with subtitles and upload to all platforms
     */
    public function renderVideoWithSubtitles(string $generationId, \App\Models\Video $video)
    {
        try {
            $generation = $this->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                throw new \Exception('Generation not completed');
            }

            Log::info('Starting video rendering with subtitles', [
                'generation_id' => $generationId,
                'video_id' => $video->id,
                'original_file_path' => $video->original_file_path,
            ]);

            // Get original video path using Laravel Storage helper
            if (!$video->original_file_path) {
                Log::error('Video has no original file path', [
                    'video_id' => $video->id,
                    'generation_id' => $generationId,
                ]);
                throw new \Exception('Original video file path not available. Please ensure the video is properly uploaded.');
            }

            $originalVideoPath = \Illuminate\Support\Facades\Storage::path($video->original_file_path);
            
            Log::info('Checking video file existence', [
                'generation_id' => $generationId,
                'video_id' => $video->id,
                'resolved_path' => $originalVideoPath,
                'file_exists' => file_exists($originalVideoPath),
            ]);

            if (!file_exists($originalVideoPath)) {
                Log::error('Original video file not found at resolved path', [
                    'video_id' => $video->id,
                    'generation_id' => $generationId,
                    'original_file_path' => $video->original_file_path,
                    'resolved_path' => $originalVideoPath,
                    'file_exists' => file_exists($originalVideoPath),
                ]);
                throw new \Exception('Original video file not found at path: ' . $originalVideoPath);
            }

            // Create rendered video with all subtitle customizations
            $renderedVideoPath = $this->renderVideoWithCustomSubtitles($generationId, $originalVideoPath);

            // Store the rendered video
            $renderedVideoRelativePath = 'videos/rendered/' . basename($renderedVideoPath);
            \Illuminate\Support\Facades\Storage::put($renderedVideoRelativePath, file_get_contents($renderedVideoPath));

            // Create a new video record for the rendered version (keeping original)
            $renderedVideo = \App\Models\Video::create([
                'user_id' => $video->user_id,
                'channel_id' => $video->channel_id,
                'title' => $video->title . ' (with subtitles)',
                'description' => $video->description,
                'original_file_path' => $renderedVideoRelativePath,
                'duration' => $video->duration,
                'thumbnail_path' => $video->thumbnail_path,
                'video_width' => $video->video_width,
                'video_height' => $video->video_height,
            ]);

            // Create video targets for all platforms that were originally selected
            $originalTargets = $video->targets;
            $uploadService = app(\App\Services\VideoUploadService::class);

            foreach ($originalTargets as $originalTarget) {
                $newTarget = \App\Models\VideoTarget::create([
                    'video_id' => $renderedVideo->id,
                    'platform' => $originalTarget->platform,
                    'status' => 'pending',
                    'publish_at' => now(),
                    'advanced_options' => $originalTarget->advanced_options,
                ]);

                // Dispatch upload job for the rendered video
                $uploadService->dispatchUploadJob($newTarget);
            }

            // Generate proper download URL using the video serving route
            $renderedVideoFilename = basename($renderedVideoRelativePath);
            $renderedVideoUrl = route('video.serve', ['filename' => $renderedVideoFilename]);

            $result = [
                'rendered_video_id' => $renderedVideo->id,
                'rendered_video_path' => $renderedVideoRelativePath,
                'rendered_video_url' => $renderedVideoUrl,
                'original_video_preserved' => true,
                'platforms_queued' => $originalTargets->pluck('platform')->toArray(),
                'upload_targets_created' => $originalTargets->count(),
            ];

            // Update generation data with rendering result
            $generation['rendered_video'] = $result;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);

            Log::info('Video rendered with subtitles and upload jobs dispatched', [
                'generation_id' => $generationId,
                'rendered_video_id' => $renderedVideo->id,
                'platforms' => $result['platforms_queued'],
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('Video rendering with subtitles failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Render video with custom subtitles using FFmpeg with advanced effects
     */
    private function renderVideoWithCustomSubtitles(string $generationId, string $videoPath): string
    {
        $generation = $this->getGenerationProgress($generationId);
        $subtitles = $generation['subtitles'] ?? [];

        // Create a temporary directory for rendering assets
        $tempDir = storage_path('app/temp/render_' . $generationId);
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        // Output path for rendered video
        $outputPath = storage_path('app/temp/rendered_' . uniqid() . '.mp4');
        
        // Ensure temp directory exists
        if (!file_exists(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        // Check if we have advanced effects that need frame-by-frame rendering
        $hasAdvancedEffects = $this->hasAdvancedEffects($subtitles);

        if ($hasAdvancedEffects) {
            // Use advanced rendering with overlay effects
            $renderedVideoPath = $this->renderVideoWithAdvancedEffects($videoPath, $subtitles, $generationId, $tempDir);
        } else {
            // Use standard ASS/SSA subtitle rendering
            $assFilePath = $this->generateAdvancedSubtitleFile($subtitles, $generationId);
            $renderedVideoPath = $this->renderVideoWithASSSubtitles($videoPath, $assFilePath, $outputPath);
        }

        // Clean up temporary directory
        $this->cleanupTempDirectory($tempDir);

        return $renderedVideoPath;
    }

    /**
     * Check if subtitles contain advanced effects that need special rendering
     */
    private function hasAdvancedEffects(array $subtitles): bool
    {
        foreach ($subtitles as $subtitle) {
            $preset = $subtitle['style']['preset'] ?? '';
            if (in_array($preset, ['bubbles', 'confetti', 'typewriter', 'bounce'])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Render video with advanced effects using frame-by-frame processing
     */
    private function renderVideoWithAdvancedEffects(string $videoPath, array $subtitles, string $generationId, string $tempDir): string
    {
        // Get video properties
        $videoInfo = $this->getVideoInfo($videoPath);
        $fps = $videoInfo['fps'] ?? 30;
        $duration = $videoInfo['duration'] ?? 0;
        $width = $videoInfo['width'] ?? 1920;
        $height = $videoInfo['height'] ?? 1080;

        // Create overlay images for each frame that has subtitles
        $overlayFrames = $this->generateOverlayFrames($subtitles, $fps, $duration, $width, $height, $tempDir);

        // Render final video with overlays
        $outputPath = storage_path('app/temp/rendered_advanced_' . uniqid() . '.mp4');
        $this->renderVideoWithOverlays($videoPath, $overlayFrames, $outputPath, $fps);

        return $outputPath;
    }

    /**
     * Generate overlay frames for advanced subtitle effects
     */
    private function generateOverlayFrames(array $subtitles, float $fps, float $duration, int $width, int $height, string $tempDir): array
    {
        $overlayFrames = [];
        $totalFrames = (int)round($duration * $fps);

        // Create a mapping of frame numbers to active subtitles
        $frameSubtitles = [];
        
        foreach ($subtitles as $subtitle) {
            $startFrame = (int)round($subtitle['start_time'] * $fps);
            $endFrame = (int)round($subtitle['end_time'] * $fps);
            
            for ($frame = $startFrame; $frame <= $endFrame && $frame < $totalFrames; $frame++) {
                if (!isset($frameSubtitles[$frame])) {
                    $frameSubtitles[$frame] = [];
                }
                $frameSubtitles[$frame][] = $subtitle;
            }
        }

        // Generate overlay images for frames with subtitles
        foreach ($frameSubtitles as $frameNumber => $frameSubtitleList) {
            $currentTime = $frameNumber / $fps;
            $overlayPath = $tempDir . '/overlay_' . sprintf('%08d', $frameNumber) . '.png';
            
            $this->generateSubtitleOverlayImage($frameSubtitleList, $currentTime, $width, $height, $overlayPath);
            $overlayFrames[$frameNumber] = $overlayPath;
        }

        return $overlayFrames;
    }

    /**
     * Generate a single overlay image with all subtitle effects for a specific frame
     */
    private function generateSubtitleOverlayImage(array $subtitles, float $currentTime, int $width, int $height, string $outputPath): void
    {
        // Create transparent canvas
        $canvas = imagecreatetruecolor($width, $height);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);
        imagealphablending($canvas, true);

        foreach ($subtitles as $subtitle) {
            $this->renderSubtitleOnCanvas($canvas, $subtitle, $currentTime, $width, $height);
        }

        // Save as PNG with transparency
        imagepng($canvas, $outputPath);
        imagedestroy($canvas);
    }

    /**
     * Render a single subtitle with effects on the canvas
     */
    private function renderSubtitleOnCanvas($canvas, array $subtitle, float $currentTime, int $width, int $height): void
    {
        $style = $subtitle['style'] ?? [];
        $position = $subtitle['position'] ?? ['x' => 50, 'y' => 85];
        $preset = $style['preset'] ?? 'standard';
        $text = $subtitle['text'] ?? '';
        $words = $subtitle['words'] ?? [];

        // Calculate position on canvas
        $x = (int)round(($position['x'] / 100) * $width);
        $y = (int)round(($position['y'] / 100) * $height);

        // Get colors
        $textColor = $this->hexToRGB($style['color'] ?? '#FFFFFF');
        $bgColor = $this->parseBackgroundColor($style['backgroundColor'] ?? 'transparent');
        
        // Handle different presets
        switch ($preset) {
            case 'bubbles':
                $this->renderBubblesEffect($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
            case 'confetti':
                $this->renderConfettiEffect($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
            case 'neon':
                $this->renderNeonEffect($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
            case 'typewriter':
                $this->renderTypewriterEffect($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
            case 'bounce':
                $this->renderBounceEffect($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
            default:
                $this->renderStandardSubtitle($canvas, $subtitle, $currentTime, $x, $y, $width, $height, $textColor, $bgColor);
                break;
        }
    }

    /**
     * Render bubbles effect - words scale and glow as they're spoken
     */
    private function renderBubblesEffect($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $words = $subtitle['words'] ?? [];
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 36);
        
        // If no word timing, fall back to simple timing distribution
        if (empty($words)) {
            $words = $this->distributeWordsEvenly($subtitle['text'], $subtitle['start_time'], $subtitle['end_time']);
        }

        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Arial');
        $activeColor = $this->hexToRGB('#FF1493'); // Deep pink for active words
        
        $currentX = $x - ($this->getTextWidth($subtitle['text'], $fontSize, $fontPath) / 2);
        
        foreach ($words as $wordData) {
            $word = is_array($wordData) ? $wordData['word'] : $wordData;
            $isActive = $this->isWordActive($wordData, $currentTime);
            
            // Scale effect for active words
            $scale = $isActive ? 1.4 : 1.0;
            $scaledFontSize = (int)round($fontSize * $scale);
            
            // Color effect
            $color = $isActive ? $activeColor : $textColor;
            $gdColor = imagecolorallocate($canvas, $color['r'], $color['g'], $color['b']);
            
            // Glow effect for active words
            if ($isActive) {
                $this->addGlowEffect($canvas, $word, $currentX, $y, $scaledFontSize, $fontPath, $color, 15);
            }
            
            // Render word
            $this->renderTextWithShadow($canvas, $word, $currentX, $y, $scaledFontSize, $fontPath, $gdColor, $bgColor);
            
            // Move to next word position
            $wordWidth = $this->getTextWidth($word, $fontSize, $fontPath);
            $currentX += $wordWidth + 10; // 10px spacing
        }
    }

    /**
     * Render confetti effect - words pop in with particles
     */
    private function renderConfettiEffect($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $words = $subtitle['words'] ?? [];
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 38);
        
        if (empty($words)) {
            $words = $this->distributeWordsEvenly($subtitle['text'], $subtitle['start_time'], $subtitle['end_time']);
        }

        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Comic Sans MS');
        
        $currentX = $x - ($this->getTextWidth($subtitle['text'], $fontSize, $fontPath) / 2);
        
        foreach ($words as $wordData) {
            $word = is_array($wordData) ? $wordData['word'] : $wordData;
            $isActive = $this->isWordActive($wordData, $currentTime);
            
            // Only show active word in confetti effect
            if (!$isActive) {
                // Show faded version
                $opacity = 0.4;
                $fadeColor = imagecolorallocatealpha($canvas, $textColor['r'], $textColor['g'], $textColor['b'], (int)round(127 * (1 - $opacity)));
                $this->renderTextWithShadow($canvas, $word, $currentX, $y, $fontSize, $fontPath, $fadeColor, $bgColor);
            } else {
                // Active word with confetti particles
                $scale = 1.3;
                $scaledFontSize = (int)round($fontSize * $scale);
                
                // Golden glow for active word
                $glowColor = $this->hexToRGB('#FFD700');
                $this->addGlowEffect($canvas, $word, $currentX, $y, $scaledFontSize, $fontPath, $glowColor, 25);
                
                // Render word
                $gdColor = imagecolorallocate($canvas, 255, 255, 255); // White text
                $this->renderTextWithShadow($canvas, $word, $currentX, $y, $scaledFontSize, $fontPath, $gdColor, $bgColor);
                
                // Add confetti particles around the word
                $this->addConfettiParticles($canvas, $currentX, $y, $fontSize);
            }
            
            $wordWidth = $this->getTextWidth($word, $fontSize, $fontPath);
            $currentX += $wordWidth + 10;
        }
    }

    /**
     * Render neon effect - glowing cyan text
     */
    private function renderNeonEffect($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 40);
        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Impact');
        
        $neonColor = $this->hexToRGB('#00FFFF'); // Cyan
        $gdColor = imagecolorallocate($canvas, $neonColor['r'], $neonColor['g'], $neonColor['b']);
        
        // Multiple glow layers for neon effect
        $this->addGlowEffect($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $neonColor, 30);
        $this->addGlowEffect($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $neonColor, 20);
        $this->addGlowEffect($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $neonColor, 10);
        
        // Render main text
        $this->renderTextWithShadow($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $gdColor, $bgColor);
    }

    /**
     * Helper method to check if a word is currently active
     */
    private function isWordActive($wordData, float $currentTime): bool
    {
        if (is_array($wordData) && isset($wordData['start_time'], $wordData['end_time'])) {
            return $currentTime >= $wordData['start_time'] && $currentTime <= $wordData['end_time'];
        }
        return false;
    }

    /**
     * Distribute words evenly across subtitle duration (fallback when no word timing)
     */
    private function distributeWordsEvenly(string $text, float $startTime, float $endTime): array
    {
        $words = explode(' ', $text);
        $duration = $endTime - $startTime;
        $wordsPerSecond = count($words) / $duration;
        
        $distributedWords = [];
        foreach ($words as $index => $word) {
            $wordStartTime = $startTime + ($index / $wordsPerSecond);
            $wordEndTime = $startTime + (($index + 1) / $wordsPerSecond);
            
            $distributedWords[] = [
                'word' => $word,
                'start_time' => $wordStartTime,
                'end_time' => $wordEndTime
            ];
        }
        
        return $distributedWords;
    }

    /**
     * Add glow effect around text
     */
    private function addGlowEffect($canvas, string $text, int $x, int $y, int $fontSize, string $fontPath, array $color, int $blur): void
    {
        // Create glow by rendering text multiple times with slight offsets
        $glowColor = imagecolorallocatealpha($canvas, $color['r'], $color['g'], $color['b'], 100);
        
        if (empty($fontPath) || !file_exists($fontPath)) {
            // Use built-in font for glow effect
            $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
            for ($i = 1; $i <= $blur; $i++) {
                $offset = $i * 2;
                for ($dx = -$offset; $dx <= $offset; $dx += 2) {
                    for ($dy = -$offset; $dy <= $offset; $dy += 2) {
                        if ($dx !== 0 || $dy !== 0) {
                            imagestring($canvas, $builtinSize, $x + $dx, $y + $dy, $text, $glowColor);
                        }
                    }
                }
            }
            return;
        }
        
        try {
            for ($i = 1; $i <= $blur; $i++) {
                $offset = $i * 2;
                for ($dx = -$offset; $dx <= $offset; $dx += 2) {
                    for ($dy = -$offset; $dy <= $offset; $dy += 2) {
                        if ($dx !== 0 || $dy !== 0) {
                            imagettftext($canvas, $fontSize, 0, $x + $dx, $y + $dy, $glowColor, $fontPath, $text);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to add glow effect with TTF font, using fallback', ['error' => $e->getMessage()]);
            // Fallback to built-in fonts
            $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
            for ($i = 1; $i <= $blur; $i++) {
                $offset = $i * 2;
                for ($dx = -$offset; $dx <= $offset; $dx += 2) {
                    for ($dy = -$offset; $dy <= $offset; $dy += 2) {
                        if ($dx !== 0 || $dy !== 0) {
                            imagestring($canvas, $builtinSize, $x + $dx, $y + $dy, $text, $glowColor);
                        }
                    }
                }
            }
        }
    }

    /**
     * Add confetti particles around text
     */
    private function addConfettiParticles($canvas, int $x, int $y, int $fontSize): void
    {
        $colors = [
            ['r' => 255, 'g' => 215, 'b' => 0],   // Gold
            ['r' => 255, 'g' => 105, 'b' => 180], // Hot Pink
            ['r' => 0, 'g' => 206, 'b' => 209],   // Dark Turquoise
            ['r' => 255, 'g' => 69, 'b' => 0],    // Orange Red
            ['r' => 147, 'g' => 112, 'b' => 219]  // Medium Slate Blue
        ];
        
        // Generate random particles around the text
        for ($i = 0; $i < 15; $i++) {
            $color = $colors[array_rand($colors)];
            $gdColor = imagecolorallocate($canvas, $color['r'], $color['g'], $color['b']);
            
            $particleX = $x + rand(-$fontSize, $fontSize);
            $particleY = $y + rand(-$fontSize/2, $fontSize/2);
            $size = rand(3, 8);
            
            // Draw particle (small rectangle)
            imagefilledrectangle($canvas, $particleX, $particleY, $particleX + $size, $particleY + $size, $gdColor);
        }
    }

    /**
     * Render standard subtitle with background and shadow
     */
    private function renderStandardSubtitle($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 32);
        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Arial');
        
        $gdColor = imagecolorallocate($canvas, $textColor['r'], $textColor['g'], $textColor['b']);
        
        // Render with background if specified
        if ($bgColor['a'] < 127) { // Not fully transparent
            $this->renderTextBackground($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $bgColor, $style);
        }
        
        $this->renderTextWithShadow($canvas, $subtitle['text'], $x, $y, $fontSize, $fontPath, $gdColor, $bgColor);
    }



    /**
     * Get font path based on font family
     */
    private function getFontPath(string $fontFamily): string
    {
        // Map font families to actual font files
        $fontMap = [
            'Arial' => 'arial.ttf',
            'Comic Sans MS' => 'comic.ttf', 
            'Impact' => 'impact.ttf',
            'Trebuchet MS' => 'trebuc.ttf',
            'Times New Roman' => 'times.ttf',
            'Courier New' => 'courier.ttf',
        ];
        
        $fontFile = $fontMap[$fontFamily] ?? $fontMap['Arial'];
        
        // Try custom fonts directory first
        $customFontPath = resource_path('fonts/' . $fontFile);
        if (file_exists($customFontPath)) {
            return $customFontPath;
        }
        
        // Try storage fonts directory
        $storageFontPath = storage_path('fonts/' . $fontFile);
        if (file_exists($storageFontPath)) {
            Log::info('Found font', ['path' => $storageFontPath, 'font' => $fontFamily]);
            return $storageFontPath;
        }
        
        // Log font not found for debugging
        Log::warning('Font not found in storage', [
            'requested_font' => $fontFamily,
            'checked_path' => $storageFontPath,
            'exists' => file_exists($storageFontPath)
        ]);
        
        // Try system fonts (common paths)
        $systemPaths = [
            '/System/Library/Fonts/' . $fontFile,
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/TTF/' . $fontFile,
            '/Windows/Fonts/' . $fontFile,
        ];
        
        foreach ($systemPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }
        
        // Ultimate fallback - use built-in fonts or null for imagestring
        Log::warning('Font not found, using built-in font fallback', [
            'requested_font' => $fontFamily,
            'font_file' => $fontFile
        ]);
        
        return ''; // This will cause imagettftext to fail gracefully and we can use imagestring instead
    }

    /**
     * Render text with shadow effect (with font fallback)
     */
    private function renderTextWithShadow($canvas, string $text, int $x, int $y, int $fontSize, string $fontPath, $textColor, array $bgColor): void
    {
        if (empty($fontPath) || !file_exists($fontPath)) {
            // Fallback to built-in font
            $this->renderTextWithBuiltinFont($canvas, $text, $x, $y, $fontSize, $textColor);
            return;
        }
        
        try {
            // Draw shadow
            $shadowColor = imagecolorallocatealpha($canvas, 0, 0, 0, 50);
            imagettftext($canvas, $fontSize, 0, $x + 2, $y + 2, $shadowColor, $fontPath, $text);
            
            // Draw main text
            imagettftext($canvas, $fontSize, 0, $x, $y, $textColor, $fontPath, $text);
        } catch (\Exception $e) {
            Log::warning('Failed to render text with TTF font, using fallback', [
                'error' => $e->getMessage(),
                'font' => $fontPath,
                'text' => substr($text, 0, 20)
            ]);
            // Fallback to built-in font
            $this->renderTextWithBuiltinFont($canvas, $text, $x, $y, $fontSize, $textColor);
        }
    }

    /**
     * Render text using built-in fonts when TTF fonts are not available
     */
    private function renderTextWithBuiltinFont($canvas, string $text, int $x, int $y, int $fontSize, $textColor): void
    {
        // Map font size to built-in font size (1-5)
        $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
        
        // Draw shadow
        $shadowColor = imagecolorallocatealpha($canvas, 0, 0, 0, 50);
        imagestring($canvas, $builtinSize, $x + 2, $y + 2, $text, $shadowColor);
        
        // Draw main text
        imagestring($canvas, $builtinSize, $x, $y, $text, $textColor);
    }

    /**
     * Get text width for positioning (with font fallback)
     */
    private function getTextWidth(string $text, int $fontSize, string $fontPath): int
    {
        if (empty($fontPath) || !file_exists($fontPath)) {
            // Fallback calculation for built-in fonts
            $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
            $charWidth = [10, 11, 13, 15, 16][$builtinSize - 1]; // Approximate character widths
            return strlen($text) * $charWidth;
        }
        
        try {
            $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
            if ($bbox === false) {
                Log::warning('imagettfbbox failed, using fallback', ['font' => $fontPath, 'text' => substr($text, 0, 20)]);
                $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
                $charWidth = [10, 11, 13, 15, 16][$builtinSize - 1];
                return strlen($text) * $charWidth;
            }
            return $bbox[4] - $bbox[0];
        } catch (\Exception $e) {
            Log::error('Error getting text width', ['error' => $e->getMessage(), 'font' => $fontPath]);
            $builtinSize = max(1, min(5, (int)round($fontSize / 8)));
            $charWidth = [10, 11, 13, 15, 16][$builtinSize - 1];
            return strlen($text) * $charWidth;
        }
    }

    /**
     * Check system requirements for advanced subtitle rendering
     */
    private function checkSystemRequirements(): array
    {
        $requirements = [
            'gd_extension' => extension_loaded('gd'),
            'imagettftext_function' => function_exists('imagettftext'),
            'ffmpeg_available' => $this->checkFFmpegAvailability(),
            'storage_writable' => is_writable(storage_path('app/temp')),
        ];
        
        return $requirements;
    }

    /**
     * Check if FFmpeg is available
     */
    private function checkFFmpegAvailability(): bool
    {
        $output = [];
        $returnVar = 0;
        exec('ffmpeg -version 2>&1', $output, $returnVar);
        return $returnVar === 0;
    }

    /**
     * Convert hex color to RGB array
     */
    private function hexToRGB(string $hex): array
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }
        
        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2))
        ];
    }

    /**
     * Parse background color including gradients and transparency
     */
    private function parseBackgroundColor(string $bgColor): array
    {
        if ($bgColor === 'transparent') {
            return ['r' => 0, 'g' => 0, 'b' => 0, 'a' => 127];
        }
        
        if (strpos($bgColor, 'rgba') !== false) {
            preg_match('/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/', $bgColor, $matches);
            if (count($matches) === 5) {
                return [
                    'r' => (int)$matches[1],
                    'g' => (int)$matches[2],
                    'b' => (int)$matches[3],
                    'a' => (int)((1 - (float)$matches[4]) * 127)
                ];
            }
        }
        
        $rgb = $this->hexToRGB($bgColor);
        return array_merge($rgb, ['a' => 0]);
    }

    /**
     * Get video information including FPS, dimensions, duration
     */
    private function getVideoInfo(string $videoPath): array
    {
        $command = sprintf(
            'ffprobe -v quiet -print_format json -show_format -show_streams %s',
            escapeshellarg($videoPath)
        );
        
        $output = shell_exec($command);
        $videoInfo = json_decode($output, true);
        
        $info = [
            'duration' => 0,
            'fps' => 30,
            'width' => 1920,
            'height' => 1080
        ];
        
        if (isset($videoInfo['format']['duration'])) {
            $info['duration'] = (float)$videoInfo['format']['duration'];
        }
        
        if (isset($videoInfo['streams'])) {
            foreach ($videoInfo['streams'] as $stream) {
                if ($stream['codec_type'] === 'video') {
                    if (isset($stream['r_frame_rate'])) {
                        $frameRate = explode('/', $stream['r_frame_rate']);
                        if (count($frameRate) === 2 && $frameRate[1] > 0) {
                            $info['fps'] = $frameRate[0] / $frameRate[1];
                        }
                    }
                    if (isset($stream['width'], $stream['height'])) {
                        $info['width'] = $stream['width'];
                        $info['height'] = $stream['height'];
                    }
                    break;
                }
            }
        }
        
        return $info;
    }

    /**
     * Render video with overlay frames using FFmpeg
     */
    private function renderVideoWithOverlays(string $videoPath, array $overlayFrames, string $outputPath, float $fps): void
    {
        // Create a temporary directory for overlay sequence
        $overlayDir = dirname($outputPath) . '/overlays_' . uniqid();
        mkdir($overlayDir, 0755, true);
        
        // Copy overlay frames to sequential naming for FFmpeg
        $frameIndex = 0;
        foreach ($overlayFrames as $frameNumber => $overlayPath) {
            $sequentialPath = $overlayDir . '/' . sprintf('overlay_%08d.png', $frameIndex);
            copy($overlayPath, $sequentialPath);
            $frameIndex++;
        }
        
        // Build FFmpeg command to overlay subtitle frames
        $command = sprintf(
            'ffmpeg -i %s -framerate %f -i %s/overlay_%%08d.png -filter_complex "[1:v]fps=%f[overlay];[0:v][overlay]overlay=0:0:enable=\'between(t,0,%f)\'" -c:a copy -c:v libx264 -preset medium -crf 23 %s 2>&1',
            escapeshellarg($videoPath),
            $fps,
            escapeshellarg($overlayDir),
            $fps,
            $this->getVideoDuration($videoPath),
            escapeshellarg($outputPath)
        );
        
        Log::info('Executing advanced subtitle rendering command', [
            'command' => $command,
        ]);
        
        exec($command, $output, $returnVar);
        
        // Clean up overlay directory
        $this->cleanupDirectory($overlayDir);
        
        if ($returnVar !== 0) {
            Log::error('Advanced subtitle rendering failed', [
                'command' => $command,
                'output' => implode("\n", $output),
                'return_var' => $returnVar,
            ]);
            throw new \Exception('Failed to render video with advanced subtitle effects: ' . implode("\n", $output));
        }
    }

    /**
     * Render video with ASS subtitles (for standard effects)
     */
    private function renderVideoWithASSSubtitles(string $videoPath, string $assFilePath, string $outputPath): string
    {
        $command = "ffmpeg -i " . escapeshellarg($videoPath) . 
                   " -vf \"ass=" . escapeshellarg($assFilePath) . "\"" .
                   " -c:a copy -c:v libx264 -preset medium -crf 23" .
                   " " . escapeshellarg($outputPath) . " 2>&1";

        Log::info('Executing standard subtitle rendering command', [
            'command' => $command,
        ]);

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            Log::error('Standard subtitle rendering failed', [
                'command' => $command,
                'output' => implode("\n", $output),
                'return_var' => $returnVar,
            ]);
            throw new \Exception('Failed to render video with subtitles: ' . implode("\n", $output));
        }

        return $outputPath;
    }

    /**
     * Clean up temporary directory
     */
    private function cleanupTempDirectory(string $tempDir): void
    {
        if (is_dir($tempDir)) {
            $this->cleanupDirectory($tempDir);
        }
    }
    
    /**
     * Recursively clean up directory
     */
    private function cleanupDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;
        
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->cleanupDirectory($path);
            } else {
                unlink($path);
            }
        }
        rmdir($dir);
    }

    /**
     * Render typewriter effect - characters appear one by one
     */
    private function renderTypewriterEffect($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 24);
        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Courier New');
        $gdColor = imagecolorallocate($canvas, $textColor['r'], $textColor['g'], $textColor['b']);
        
        $text = $subtitle['text'];
        $startTime = $subtitle['start_time'];
        $endTime = $subtitle['end_time'];
        $duration = $endTime - $startTime;
        
        // Calculate how many characters should be visible
        $progress = ($currentTime - $startTime) / $duration;
        $visibleChars = (int)round($progress * strlen($text));
        $visibleText = substr($text, 0, $visibleChars);
        
        // Add cursor effect
        $showCursor = (int)round($currentTime * 2) % 2 === 0; // Blink every 0.5 seconds
        if ($showCursor && $visibleChars < strlen($text)) {
            $visibleText .= '|';
        }
        
        // Render background
        if ($bgColor['a'] < 127) {
            $this->renderTextBackground($canvas, $visibleText, $x, $y, $fontSize, $fontPath, $bgColor, $style);
        }
        
        $this->renderTextWithShadow($canvas, $visibleText, $x, $y, $fontSize, $fontPath, $gdColor, $bgColor);
    }

    /**
     * Render bounce effect - words bounce in with elastic animation
     */
    private function renderBounceEffect($canvas, array $subtitle, float $currentTime, int $x, int $y, int $width, int $height, array $textColor, array $bgColor): void
    {
        $words = $subtitle['words'] ?? [];
        $style = $subtitle['style'] ?? [];
        $fontSize = (int)($style['fontSize'] ?? 30);
        
        if (empty($words)) {
            $words = $this->distributeWordsEvenly($subtitle['text'], $subtitle['start_time'], $subtitle['end_time']);
        }

        $fontPath = $this->getFontPath($style['fontFamily'] ?? 'Comic Sans MS');
        $bounceColor = $this->hexToRGB('#FFD700'); // Gold color
        
        $currentX = $x - ($this->getTextWidth($subtitle['text'], $fontSize, $fontPath) / 2);
        
        foreach ($words as $wordData) {
            $word = is_array($wordData) ? $wordData['word'] : $wordData;
            $isActive = $this->isWordActive($wordData, $currentTime);
            
            if ($isActive) {
                // Calculate bounce animation
                $wordStartTime = is_array($wordData) ? $wordData['start_time'] : $subtitle['start_time'];
                $timeInWord = $currentTime - $wordStartTime;
                $bounceProgress = min(1.0, $timeInWord / 0.5); // 0.5 second bounce duration
                
                // Elastic bounce formula
                $bounce = 1.0 - pow(2, -10 * $bounceProgress) * cos((20 * $bounceProgress - 1.5) * M_PI / 3);
                $bounceOffset = (int)round(30 * (1 - $bounce)); // Bounce up to 30 pixels
                
                $scale = 1.0 + (0.5 * $bounce); // Scale from 1.0 to 1.5
                $scaledFontSize = (int)round($fontSize * $scale);
                
                $gdColor = imagecolorallocate($canvas, $bounceColor['r'], $bounceColor['g'], $bounceColor['b']);
                $this->renderTextWithShadow($canvas, $word, $currentX, $y - $bounceOffset, $scaledFontSize, $fontPath, $gdColor, $bgColor);
            } else {
                // Render normal word
                $gdColor = imagecolorallocate($canvas, $textColor['r'], $textColor['g'], $textColor['b']);
                $this->renderTextWithShadow($canvas, $word, $currentX, $y, $fontSize, $fontPath, $gdColor, $bgColor);
            }
            
            $wordWidth = $this->getTextWidth($word, $fontSize, $fontPath);
            $currentX += $wordWidth + 10;
        }
    }

    /**
     * Render text background
     */
    private function renderTextBackground($canvas, string $text, int $x, int $y, int $fontSize, string $fontPath, array $bgColor, array $style): void
    {
        // Get text dimensions
        $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
        $textWidth = $bbox[4] - $bbox[0];
        $textHeight = $bbox[1] - $bbox[7];
        
        // Calculate background rectangle
        $padding = (int)($style['padding'] ?? 8);
        $borderRadius = (int)($style['borderRadius'] ?? 4);
        
        $bgX = $x - ($textWidth / 2) - $padding;
        $bgY = $y - $textHeight - $padding;
        $bgWidth = $textWidth + (2 * $padding);
        $bgHeight = $textHeight + (2 * $padding);
        
        // Create background color
        $gdBgColor = imagecolorallocatealpha($canvas, $bgColor['r'], $bgColor['g'], $bgColor['b'], $bgColor['a']);
        
        // Draw rounded rectangle background
        if ($borderRadius > 0) {
            $this->drawRoundedRectangle($canvas, (int)round($bgX), (int)round($bgY), (int)round($bgWidth), (int)round($bgHeight), $borderRadius, $gdBgColor);
        } else {
            imagefilledrectangle($canvas, (int)round($bgX), (int)round($bgY), (int)round($bgX + $bgWidth), (int)round($bgY + $bgHeight), $gdBgColor);
        }
    }

    /**
     * Draw rounded rectangle
     */
    private function drawRoundedRectangle($canvas, int $x, int $y, int $width, int $height, int $radius, $color): void
    {
        // Draw main rectangle
        imagefilledrectangle($canvas, $x + $radius, $y, $x + $width - $radius, $y + $height, $color);
        imagefilledrectangle($canvas, $x, $y + $radius, $x + $width, $y + $height - $radius, $color);
        
        // Draw rounded corners
        imagefilledellipse($canvas, $x + $radius, $y + $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($canvas, $x + $width - $radius, $y + $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($canvas, $x + $radius, $y + $height - $radius, $radius * 2, $radius * 2, $color);
        imagefilledellipse($canvas, $x + $width - $radius, $y + $height - $radius, $radius * 2, $radius * 2, $color);
    }

    /**
     * Generate advanced subtitle file (ASS format) with individual styling
     */
    private function generateAdvancedSubtitleFile(array $subtitles, string $generationId): string
    {
        $assPath = storage_path('app/temp/subtitles_' . $generationId . '.ass');
        
        // Ensure temp directory exists
        if (!file_exists(dirname($assPath))) {
            mkdir(dirname($assPath), 0755, true);
        }

        // ASS file header
        $assContent = "[Script Info]\n";
        $assContent .= "Title: Generated Subtitles with Custom Styling\n";
        $assContent .= "ScriptType: v4.00+\n\n";
        
        $assContent .= "[V4+ Styles]\n";
        $assContent .= "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
        $assContent .= "Style: Default,Arial,24,&Hffffff,&Hffffff,&H0,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n";
        
        $assContent .= "[Events]\n";
        $assContent .= "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

        foreach ($subtitles as $subtitle) {
            $startTime = $this->formatASSTime($subtitle['start_time']);
            $endTime = $this->formatASSTime($subtitle['end_time']);
            
            // Build styling overrides based on individual subtitle style
            $style = $subtitle['style'] ?? $this->getDefaultSubtitleStyle();
            $styleOverrides = $this->buildASSStyleOverrides($style, $subtitle['position'] ?? ['x' => 50, 'y' => 85]);
            
            $text = str_replace(["\n", "\r"], "\\N", $subtitle['text']);
            $assContent .= "Dialogue: 0,{$startTime},{$endTime},Default,,0,0,0,,{$styleOverrides}{$text}\n";
        }

        file_put_contents($assPath, $assContent);
        return $assPath;
    }

    /**
     * Build ASS style overrides for individual subtitles
     */
    private function buildASSStyleOverrides(array $style, array $position): string
    {
        $overrides = [];
        
        // Font family
        if (isset($style['fontFamily'])) {
            $overrides[] = "\\fn" . $style['fontFamily'];
        }
        
        // Font size
        if (isset($style['fontSize'])) {
            $overrides[] = "\\fs" . $style['fontSize'];
        }
        
        // Font weight (bold)
        if (isset($style['bold']) && $style['bold']) {
            $overrides[] = "\\b1";
        }
        
        // Italic
        if (isset($style['italic']) && $style['italic']) {
            $overrides[] = "\\i1";
        }
        
        // Underline
        if (isset($style['underline']) && $style['underline']) {
            $overrides[] = "\\u1";
        }
        
        // Text color (convert from hex to BGR format for ASS)
        if (isset($style['color'])) {
            $color = $this->hexToBGR($style['color']);
            $overrides[] = "\\c&H" . $color . "&";
        }
        
        // Position
        $x = ($position['x'] / 100) * 1920; // Assuming 1920px width
        $y = ($position['y'] / 100) * 1080; // Assuming 1080px height
        $overrides[] = "\\pos(" . round($x) . "," . round($y) . ")";
        
        // Text alignment
        if (isset($style['textAlign'])) {
            $alignment = $style['textAlign'] === 'left' ? 1 : ($style['textAlign'] === 'right' ? 3 : 2);
            $overrides[] = "\\an" . $alignment;
        }
        
        return empty($overrides) ? '' : '{' . implode('', $overrides) . '}';
    }

    /**
     * Convert hex color to BGR format for ASS
     */
    private function hexToBGR(string $hex): string
    {
        $hex = ltrim($hex, '#');
        if (strlen($hex) === 6) {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
            return sprintf('%02X%02X%02X', $b, $g, $r);
        }
        return 'FFFFFF'; // Default to white
    }

    /**
     * Format time for ASS format (H:MM:SS.cc)
     */
    private function formatASSTime(float $seconds): string
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;
        
        return sprintf('%d:%02d:%05.2f', $hours, $minutes, $secs);
    }

    /**
     * Get default subtitle style
     */
    private function getDefaultSubtitleStyle(): array
    {
        return [
            'fontFamily' => 'Arial',
            'fontSize' => 24,
            'fontWeight' => 'bold',
            'color' => '#FFFFFF',
            'backgroundColor' => 'rgba(0, 0, 0, 0.7)',
            'textAlign' => 'center',
            'bold' => true,
            'italic' => false,
            'underline' => false,
            'borderRadius' => 4,
            'padding' => 8,
            'textShadow' => '2px 2px 4px rgba(0, 0, 0, 0.5)'
        ];
    }

    /**
     * Regenerate SRT file with updated subtitles
     */
    private function regenerateSRTFile(string $generationId, array $subtitles): string
    {
        $srtPath = storage_path('app/temp/subtitles_' . $generationId . '.srt');
        
        $srtContent = '';
        foreach ($subtitles as $index => $subtitle) {
            $srtContent .= ($index + 1) . "\n";
            $srtContent .= $this->formatSRTTime($subtitle['start_time']) . ' --> ' . $this->formatSRTTime($subtitle['end_time']) . "\n";
            $srtContent .= $subtitle['text'] . "\n\n";
        }
        
        file_put_contents($srtPath, $srtContent);
        
        // Update the generation cache with new SRT path
        $generation = Cache::get("subtitle_generation_{$generationId}");
        if ($generation) {
            $generation['srt_file'] = $srtPath;
            Cache::put("subtitle_generation_{$generationId}", $generation, 7200);
        }
        
        return $srtPath;
    }

    public function applyStyleToAllSubtitles(string $generationId, array $style)
    {
        $generation = Cache::get("subtitle_generation_{$generationId}");
        
        if (!$generation || $generation['processing_status'] !== 'completed') {
            throw new \Exception('Subtitle generation not found or not completed');
        }

        $subtitles = $generation['subtitles'];
        foreach ($subtitles as &$subtitle) {
            $subtitle['style'] = array_merge($subtitle['style'] ?? [], $style);
        }

        $generation['subtitles'] = $subtitles;
        Cache::put("subtitle_generation_{$generationId}", $generation, 7200);

        // Also update in database if video_id is available
        if (isset($generation['video_id'])) {
            $video = \App\Models\Video::find($generation['video_id']);
            if ($video) {
                $video->subtitle_data = [
                    'generation_id' => $generationId,
                    'subtitles' => $subtitles,
                    'language' => $generation['language'] ?? 'en',
                    'style' => $generation['style'] ?? 'simple',
                    'position' => $generation['position'] ?? 'bottom_center',
                ];
                $video->save();
            }
        }

        return [
            'success' => true,
            'subtitles' => $subtitles
        ];
    }
} 