<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            // Check if columns don't already exist before adding them
            if (!Schema::hasColumn('social_accounts', 'platform_channel_id')) {
                $table->string('platform_channel_id')->nullable()->after('profile_username');
            }
            if (!Schema::hasColumn('social_accounts', 'platform_channel_name')) {
                $table->string('platform_channel_name')->nullable()->after('platform_channel_id');
            }
            if (!Schema::hasColumn('social_accounts', 'platform_channel_handle')) {
                $table->string('platform_channel_handle')->nullable()->after('platform_channel_name');
            }
            if (!Schema::hasColumn('social_accounts', 'platform_channel_url')) {
                $table->string('platform_channel_url')->nullable()->after('platform_channel_handle');
            }
            if (!Schema::hasColumn('social_accounts', 'platform_channel_data')) {
                $table->json('platform_channel_data')->nullable()->after('platform_channel_url');
            }
            if (!Schema::hasColumn('social_accounts', 'is_platform_channel_specific')) {
                $table->boolean('is_platform_channel_specific')->default(false)->after('platform_channel_data');
            }
            
            // Add index for platform channel lookups if it doesn't exist
            if (!Schema::hasIndex('social_accounts', 'social_accounts_platform_channel_id_index')) {
                $table->index(['platform', 'platform_channel_id'], 'social_accounts_platform_channel_id_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            // Only drop if they exist
            if (Schema::hasIndex('social_accounts', 'social_accounts_platform_channel_id_index')) {
                $table->dropIndex('social_accounts_platform_channel_id_index');
            }
            
            $columnsToCheck = [
                'platform_channel_id',
                'platform_channel_name', 
                'platform_channel_handle',
                'platform_channel_url',
                'platform_channel_data',
                'is_platform_channel_specific'
            ];
            
            $columnsToDrop = [];
            foreach ($columnsToCheck as $column) {
                if (Schema::hasColumn('social_accounts', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
}; 