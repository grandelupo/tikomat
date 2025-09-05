<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use App\Models\SocialAccount;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add a column to track Instagram API migration status
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->boolean('requires_scope_migration')->default(false)->after('platform');
            $table->text('migration_notes')->nullable()->after('requires_scope_migration');
        });

        // Flag existing Instagram accounts for scope migration
        $instagramAccounts = SocialAccount::where('platform', 'instagram')->get();
        
        foreach ($instagramAccounts as $account) {
            $account->update([
                'requires_scope_migration' => true,
                'migration_notes' => 'Account created before Instagram API with Instagram Login migration. ' .
                                   'User may need to reconnect due to new scope requirements. ' .
                                   'Old scopes: instagram_basic, instagram_content_publish. ' .
                                   'New scopes: instagram_business_basic, instagram_business_content_publish.'
            ]);
        }

        // Log the migration for monitoring
        Log::info('Instagram API Migration: Flagged existing Instagram accounts for scope migration', [
            'total_accounts' => $instagramAccounts->count(),
            'migration_date' => now()->toISOString(),
            'reason' => 'Instagram deprecated old scopes (instagram_basic, instagram_content_publish) on January 27, 2025',
            'new_scopes' => ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments']
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropColumn(['requires_scope_migration', 'migration_notes']);
        });
    }
}; 