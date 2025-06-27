<?php

namespace App\Http\Controllers;

use App\Services\HashtagValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class HashtagValidationController extends Controller
{
    protected HashtagValidationService $hashtagValidator;

    public function __construct(HashtagValidationService $hashtagValidator)
    {
        $this->hashtagValidator = $hashtagValidator;
    }

    /**
     * Validate hashtags for a specific platform
     */
    public function validateHashtags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
            'content' => 'required|string|max:10000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->hashtagValidator->validateAndFilterHashtags(
                $request->platform,
                $request->content
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'filtered_content' => $result['filtered_content'],
                    'removed_hashtags' => $result['removed_hashtags'],
                    'warnings' => $result['warnings'],
                    'has_changes' => $result['has_changes'],
                    'validation_message' => $this->hashtagValidator->getValidationMessage(
                        $request->platform,
                        $result['removed_hashtags']
                    )
                ],
                'message' => $result['has_changes'] 
                    ? 'Forbidden hashtags detected and removed'
                    : 'Content is valid'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate hashtags',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get forbidden hashtags for a platform
     */
    public function getForbiddenHashtags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $forbiddenHashtags = $this->hashtagValidator->getForbiddenHashtags($request->platform);

            return response()->json([
                'success' => true,
                'data' => [
                    'platform' => $request->platform,
                    'forbidden_hashtags' => $forbiddenHashtags,
                    'count' => count($forbiddenHashtags)
                ],
                'message' => 'Forbidden hashtags retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get forbidden hashtags',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Check if a specific hashtag is forbidden
     */
    public function checkHashtag(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
            'hashtag' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $isForbidden = $this->hashtagValidator->isHashtagForbidden(
                $request->platform,
                $request->hashtag
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'platform' => $request->platform,
                    'hashtag' => $request->hashtag,
                    'is_forbidden' => $isForbidden
                ],
                'message' => $isForbidden 
                    ? 'Hashtag is forbidden for this platform'
                    : 'Hashtag is allowed for this platform'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check hashtag',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Validate advanced options for all platforms
     */
    public function validateAdvancedOptions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'advanced_options' => 'required|array',
            'advanced_options.*' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validationResults = $this->hashtagValidator->validateAdvancedOptions($request->advanced_options);

            return response()->json([
                'success' => true,
                'data' => [
                    'validation_results' => $validationResults,
                    'has_warnings' => !empty($validationResults)
                ],
                'message' => !empty($validationResults)
                    ? 'Forbidden hashtags detected in advanced options'
                    : 'All advanced options are valid'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate advanced options',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
} 