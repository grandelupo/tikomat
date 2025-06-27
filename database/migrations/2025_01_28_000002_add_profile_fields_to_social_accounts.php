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
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropColumn(['profile_name', 'profile_avatar_url', 'profile_username']);
        });
    }
}; 