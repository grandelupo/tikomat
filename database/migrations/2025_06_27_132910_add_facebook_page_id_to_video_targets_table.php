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
            $table->string('facebook_page_id')->nullable()->after('advanced_options');
            $table->index('facebook_page_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('video_targets', function (Blueprint $table) {
            $table->dropIndex(['facebook_page_id']);
            $table->dropColumn('facebook_page_id');
        });
    }
};
