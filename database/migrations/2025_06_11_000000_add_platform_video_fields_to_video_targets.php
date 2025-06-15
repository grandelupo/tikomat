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
        Schema::table('video_targets', function (Blueprint $table) {
            $table->string('platform_video_id')->nullable()->after('status');
            $table->string('platform_url')->nullable()->after('platform_video_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('video_targets', function (Blueprint $table) {
            $table->dropColumn(['platform_video_id', 'platform_url']);
        });
    }
}; 