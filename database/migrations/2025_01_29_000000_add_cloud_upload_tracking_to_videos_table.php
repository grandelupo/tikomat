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
            $table->json('cloud_upload_providers')->nullable()->after('rendered_video_status');
            $table->json('cloud_upload_status')->nullable()->after('cloud_upload_providers'); // {provider: status}
            $table->json('cloud_upload_results')->nullable()->after('cloud_upload_status'); // {provider: {file_id, url, etc}}
            $table->json('cloud_upload_folders')->nullable()->after('cloud_upload_results'); // {provider: folder_path}
            $table->timestamp('cloud_uploaded_at')->nullable()->after('cloud_upload_folders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn([
                'cloud_upload_providers',
                'cloud_upload_status',
                'cloud_upload_results',
                'cloud_upload_folders',
                'cloud_uploaded_at',
            ]);
        });
    }
}; 