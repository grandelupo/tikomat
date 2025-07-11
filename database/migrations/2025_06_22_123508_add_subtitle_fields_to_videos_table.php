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
        Schema::table('videos', function (Blueprint $table) {
            $table->string('subtitle_generation_id')->nullable()->after('thumbnail_time');
            $table->enum('subtitle_status', ['none', 'processing', 'completed', 'failed'])->default('none')->after('subtitle_generation_id');
            $table->string('subtitle_language', 10)->nullable()->after('subtitle_status');
            $table->string('subtitle_file_path')->nullable()->after('subtitle_language');
            $table->json('subtitle_data')->nullable()->after('subtitle_file_path');
            $table->timestamp('subtitles_generated_at')->nullable()->after('subtitle_data');
            $table->string('rendered_video_path')->nullable()->after('subtitles_generated_at');
            $table->enum('rendered_video_status', ['none', 'processing', 'completed', 'failed'])->default('none')->after('rendered_video_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'subtitle_generation_id',
                'subtitle_status',
                'subtitle_language',
                'subtitle_file_path',
                'subtitle_data',
                'subtitles_generated_at',
                'rendered_video_path',
                'rendered_video_status',
            ]);
        });
    }
};
