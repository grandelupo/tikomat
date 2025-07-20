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
        // Remove the old unique constraint that only includes user_id and platform
        // This constraint is no longer needed since we have a better one that includes channel_id
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'platform']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add the old unique constraint if needed
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->unique(['user_id', 'platform'], 'social_accounts_user_id_platform_unique');
        });
    }
}; 