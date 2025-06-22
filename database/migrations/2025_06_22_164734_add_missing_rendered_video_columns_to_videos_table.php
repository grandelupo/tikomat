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
                'rendered_video_path',
                'rendered_video_status',
            ]);
        });
    }
};
