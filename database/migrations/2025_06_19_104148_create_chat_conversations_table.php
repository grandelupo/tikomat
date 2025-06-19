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
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_admin_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('waiting'); // waiting, active, closed
            $table->string('subject')->nullable();
            $table->integer('unread_count_user')->default(0);
            $table->integer('unread_count_admin')->default(0);
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('admin_joined_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('closing_reason')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['assigned_admin_id', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_conversations');
    }
};
