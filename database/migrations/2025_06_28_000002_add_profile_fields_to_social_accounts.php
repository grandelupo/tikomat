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
            $table->string('profile_name')->nullable();
            $table->text('profile_avatar_url')->nullable();
            $table->string('profile_username')->nullable(); // For platforms that have usernames (like X, Instagram)
            $table->string('platform_channel_id')->nullable()->after('profile_username');
            $table->string('platform_channel_name')->nullable()->after('platform_channel_id');
            $table->string('platform_channel_handle')->nullable()->after('platform_channel_name');
            $table->string('platform_channel_url')->nullable()->after('platform_channel_handle');
            $table->json('platform_channel_data')->nullable()->after('platform_channel_url');
            $table->boolean('is_platform_channel_specific')->default(false)->after('platform_channel_data');
            $table->index(['platform', 'platform_channel_id'], 'social_accounts_platform_channel_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropIndex('social_accounts_platform_channel_id_index');
            $table->dropColumn([
                'platform_channel_id',
                'platform_channel_name', 
                'platform_channel_handle',
                'platform_channel_url',
                'platform_channel_data',
                'is_platform_channel_specific'
            ]);
            $table->dropColumn(['profile_name', 'profile_avatar_url', 'profile_username']);
        });
    }
}; 