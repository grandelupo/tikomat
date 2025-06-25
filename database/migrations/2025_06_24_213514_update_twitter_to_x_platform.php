<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update existing 'twitter' records to 'x'
        DB::table('social_accounts')->where('platform', 'twitter')->update(['platform' => 'x']);
        DB::table('video_targets')->where('platform', 'twitter')->update(['platform' => 'x']);
        
        // Update the enum to replace 'twitter' with 'x'
        DB::statement("ALTER TABLE social_accounts MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x')");
        DB::statement("ALTER TABLE video_targets MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update existing 'x' records back to 'twitter'
        DB::table('social_accounts')->where('platform', 'x')->update(['platform' => 'twitter']);
        DB::table('video_targets')->where('platform', 'x')->update(['platform' => 'twitter']);
        
        // Revert the enum to use 'twitter' instead of 'x'
        DB::statement("ALTER TABLE social_accounts MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'twitter')");
        DB::statement("ALTER TABLE video_targets MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'twitter')");
    }
};
