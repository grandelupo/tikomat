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
        Schema::table('contact_messages', function (Blueprint $table) {
            // Drop columns that don't match the model
            $table->dropForeign(['user_id']);
            $table->dropForeign(['replied_by']);
            $table->dropColumn(['user_id', 'name', 'reply', 'replied_by']);
            
            // Add new columns that the model expects
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->enum('status', ['unread', 'read', 'replied'])->default('unread')->after('message');
            $table->json('admin_notes')->nullable()->after('status');
            $table->timestamp('read_at')->nullable()->after('admin_notes');
            
            // Update indexes
            $table->dropIndex(['email', 'created_at']);
            $table->dropIndex(['replied_at']);
            $table->index(['status', 'created_at']);
            $table->index(['email', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            // Restore original columns
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null')->after('id');
            $table->string('name')->after('user_id');
            $table->text('reply')->nullable()->after('message');
            $table->foreignId('replied_by')->nullable()->constrained('users')->onDelete('set null')->after('replied_at');
            
            // Drop new columns
            $table->dropColumn(['first_name', 'last_name', 'status', 'admin_notes', 'read_at']);
            
            // Restore original indexes
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['email', 'status']);
            $table->index(['email', 'created_at']);
            $table->index(['replied_at']);
        });
    }
};
