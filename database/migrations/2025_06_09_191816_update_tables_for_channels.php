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
        // Add channel_id to social_accounts
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->foreignId('channel_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
            $table->index(['channel_id', 'platform']);
        });

        // Add channel_id to videos
        Schema::table('videos', function (Blueprint $table) {
            $table->foreignId('channel_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
            $table->string('thumbnail_path')->nullable()->after('original_file_path');
        });

        // Add platform restrictions to users table
        Schema::table('users', function (Blueprint $table) {
            $table->json('allowed_platforms')->nullable()->after('password'); // Store allowed platforms
            $table->boolean('has_subscription')->default(false)->after('allowed_platforms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropForeign(['channel_id']);
            $table->dropIndex(['channel_id', 'platform']);
            $table->dropColumn('channel_id');
        });

        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['channel_id']);
            $table->dropColumn(['channel_id', 'thumbnail_path']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['allowed_platforms', 'has_subscription']);
        });
    }
};
