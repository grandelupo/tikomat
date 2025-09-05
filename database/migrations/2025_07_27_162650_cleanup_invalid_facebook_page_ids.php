<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clean up invalid Facebook page IDs in social_accounts table
        $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
        
        $invalidAccounts = DB::table('social_accounts')
            ->where('platform', 'facebook')
            ->whereNotNull('facebook_page_id')
            ->get();
        
        $cleanedCount = 0;
        
        foreach ($invalidAccounts as $account) {
            $pageId = $account->facebook_page_id;
            $shouldClean = false;
            $reason = '';
            
            // Check if page ID is not numeric
            if (!is_numeric($pageId) || !ctype_digit($pageId)) {
                $shouldClean = true;
                $reason = 'non-numeric';
            }
            
            // Check for invalid patterns
            foreach ($invalidPatterns as $pattern) {
                if (stripos($pageId, $pattern) !== false) {
                    $shouldClean = true;
                    $reason = "contains '{$pattern}'";
                    break;
                }
            }
            
            if ($shouldClean) {
                Log::warning('Cleaning up invalid Facebook page ID', [
                    'social_account_id' => $account->id,
                    'user_id' => $account->user_id,
                    'channel_id' => $account->channel_id,
                    'invalid_page_id' => $pageId,
                    'reason' => $reason,
                ]);
                
                DB::table('social_accounts')
                    ->where('id', $account->id)
                    ->update([
                        'facebook_page_id' => null,
                        'facebook_page_name' => null,
                        'facebook_page_access_token' => null,
                    ]);
                
                $cleanedCount++;
            }
        }
        
        Log::info('Facebook page ID cleanup completed', [
            'total_accounts_checked' => $invalidAccounts->count(),
            'accounts_cleaned' => $cleanedCount,
        ]);
        
        // Clean up invalid Facebook page IDs in video_targets table
        $invalidVideoTargets = DB::table('video_targets')
            ->where('platform', 'facebook')
            ->whereNotNull('facebook_page_id')
            ->get();
        
        $cleanedVideoTargets = 0;
        
        foreach ($invalidVideoTargets as $target) {
            $pageId = $target->facebook_page_id;
            $shouldClean = false;
            $reason = '';
            
            // Check if page ID is not numeric
            if (!is_numeric($pageId) || !ctype_digit($pageId)) {
                $shouldClean = true;
                $reason = 'non-numeric';
            }
            
            // Check for invalid patterns
            foreach ($invalidPatterns as $pattern) {
                if (stripos($pageId, $pattern) !== false) {
                    $shouldClean = true;
                    $reason = "contains '{$pattern}'";
                    break;
                }
            }
            
            if ($shouldClean) {
                Log::warning('Cleaning up invalid Facebook page ID in video target', [
                    'video_target_id' => $target->id,
                    'video_id' => $target->video_id,
                    'invalid_page_id' => $pageId,
                    'reason' => $reason,
                ]);
                
                DB::table('video_targets')
                    ->where('id', $target->id)
                    ->update([
                        'facebook_page_id' => null,
                    ]);
                
                $cleanedVideoTargets++;
            }
        }
        
        Log::info('Video target Facebook page ID cleanup completed', [
            'total_targets_checked' => $invalidVideoTargets->count(),
            'targets_cleaned' => $cleanedVideoTargets,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is for cleanup, so there's no rollback needed
        // The data that was cleaned up was invalid anyway
    }
};
