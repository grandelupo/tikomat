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
        // Update social_accounts platform enum
        DB::statement("ALTER TABLE social_accounts MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'twitter')");
        
        // Update video_targets platform enum
        DB::statement("ALTER TABLE video_targets MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'twitter')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert social_accounts platform enum
        DB::statement("ALTER TABLE social_accounts MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok')");
        
        // Revert video_targets platform enum
        DB::statement("ALTER TABLE video_targets MODIFY COLUMN platform ENUM('youtube', 'instagram', 'tiktok')");
    }
};
