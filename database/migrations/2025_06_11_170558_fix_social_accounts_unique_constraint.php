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
        // Add new unique constraint that includes channel_id
        // This will coexist with the old constraint for now
        try {
            Schema::table('social_accounts', function (Blueprint $table) {
                $table->unique(['user_id', 'channel_id', 'platform'], 'social_accounts_user_channel_platform_unique');
            });
        } catch (\Exception $e) {
            // Constraint might already exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('social_accounts', function (Blueprint $table) {
                $table->dropUnique('social_accounts_user_channel_platform_unique');
            });
        } catch (\Exception $e) {
            // Constraint might not exist, ignore
        }
    }
};
