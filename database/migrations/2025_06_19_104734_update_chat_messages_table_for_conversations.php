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
        Schema::table('chat_messages', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('chat_messages', 'conversation_id')) {
                $table->foreignId('conversation_id')->nullable()->constrained('chat_conversations')->onDelete('cascade');
            }
            
            if (!Schema::hasColumn('chat_messages', 'is_from_admin')) {
                $table->boolean('is_from_admin')->default(false);
            }
            
            if (!Schema::hasColumn('chat_messages', 'read_at')) {
                $table->timestamp('read_at')->nullable();
            }
            
            if (!Schema::hasColumn('chat_messages', 'attachments')) {
                $table->json('attachments')->nullable();
            }
            
            if (!Schema::hasColumn('chat_messages', 'message_type')) {
                $table->string('message_type')->default('text');
            }

            // Drop old columns if they exist
            if (Schema::hasColumn('chat_messages', 'is_admin_message')) {
                $table->dropColumn('is_admin_message');
            }
            
            if (Schema::hasColumn('chat_messages', 'admin_user_id')) {
                $table->dropForeign(['admin_user_id']);
                $table->dropColumn('admin_user_id');
            }

            // Add indexes
            $table->index(['conversation_id', 'created_at']);
            $table->index(['conversation_id', 'is_read']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            // Remove new columns
            $table->dropForeign(['conversation_id']);
            $table->dropColumn([
                'conversation_id',
                'is_from_admin',
                'read_at',
                'attachments',
                'message_type'
            ]);

            // Re-add old columns
            $table->boolean('is_admin_message')->default(false);
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->onDelete('set null');
        });
    }
};
