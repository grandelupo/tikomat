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
        // Add check constraint for social_accounts.facebook_page_id
        DB::statement("
            ALTER TABLE social_accounts 
            ADD CONSTRAINT check_facebook_page_id_valid 
            CHECK (
                platform != 'facebook' OR 
                facebook_page_id IS NULL OR 
                (
                    facebook_page_id REGEXP '^[0-9]+$' AND
                    facebook_page_id NOT REGEXP 'instagram|facebook|twitter|tiktok|youtube|snapchat|pinterest'
                )
            )
        ");

        // Add check constraint for video_targets.facebook_page_id
        DB::statement("
            ALTER TABLE video_targets 
            ADD CONSTRAINT check_video_target_facebook_page_id_valid 
            CHECK (
                platform != 'facebook' OR 
                facebook_page_id IS NULL OR 
                (
                    facebook_page_id REGEXP '^[0-9]+$' AND
                    facebook_page_id NOT REGEXP 'instagram|facebook|twitter|tiktok|youtube|snapchat|pinterest'
                )
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove check constraints
        DB::statement("ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS check_facebook_page_id_valid");
        DB::statement("ALTER TABLE video_targets DROP CONSTRAINT IF EXISTS check_video_target_facebook_page_id_valid");
    }
};
