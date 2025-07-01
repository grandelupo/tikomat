<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class JobFailedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $jobName;
    public $errorMessage;
    public $jobData;

    /**
     * Create a new notification instance.
     */
    public function __construct($jobName, $errorMessage, $jobData = [])
    {
        $this->jobName = $jobName;
        $this->errorMessage = $errorMessage;
        $this->jobData = $jobData;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'job_name' => $this->jobName,
            'error_message' => $this->errorMessage,
            'job_data' => $this->jobData,
            'failed_at' => now()->toISOString(),
            'type' => 'job_failed',
        ];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->error()
            ->subject('Job Failed: ' . $this->jobName)
            ->line('A job has failed in your application.')
            ->line('Job: ' . $this->jobName)
            ->line('Error: ' . $this->errorMessage)
            ->action('View Dashboard', url('/dashboard'));
    }
} 