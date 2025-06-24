<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Channel;
use App\Services\OAuthErrorHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class OAuthErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    protected OAuthErrorHandler $errorHandler;
    protected User $user;
    protected Channel $channel;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->errorHandler = new OAuthErrorHandler();
        $this->user = User::factory()->create();
        $this->channel = Channel::factory()->create([
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_logs_oauth_provider_errors()
    {
        Log::spy();
        
        $request = Request::create('/test', 'GET', [
            'error' => 'access_denied',
            'error_description' => 'User cancelled authorization',
            'state' => 'test_state',
        ]);
        
        $request->setUserResolver(function () {
            return $this->user;
        });

        $this->errorHandler->logProviderError('youtube', $request);

        Log::shouldHaveReceived('channel')
            ->with('oauth')
            ->once();
    }

    /** @test */
    public function it_logs_connection_attempts()
    {
        Log::spy();
        
        $this->actingAs($this->user);
        
        $this->errorHandler->logConnectionAttempt('youtube', $this->channel->slug);

        Log::shouldHaveReceived('channel')
            ->with('oauth')
            ->once();
    }

    /** @test */
    public function it_logs_connection_failures()
    {
        Log::spy();
        
        $request = Request::create('/test');
        $request->setUserResolver(function () {
            return $this->user;
        });
        
        $exception = new \Exception('Test error message');
        
        $this->errorHandler->logConnectionFailure(
            'youtube', 
            $this->channel->slug, 
            $exception, 
            $request
        );

        Log::shouldHaveReceived('channel')
            ->with('oauth')
            ->once();
    }

    /** @test */
    public function it_formats_user_error_messages_correctly()
    {
        $request = Request::create('/test', 'GET', [
            'error' => 'access_denied',
            'error_description' => 'User cancelled authorization',
        ]);

        $exception = new \Exception('Test error');
        
        $message = $this->errorHandler->formatUserErrorMessage('youtube', $exception, $request);
        
        $this->assertStringContainsString('cancelled', $message);
        $this->assertStringContainsString('youtube', $message);
    }

    /** @test */
    public function it_handles_configuration_errors()
    {
        Log::spy();
        
        $this->actingAs($this->user);
        
        $this->errorHandler->logConfigurationError('youtube', 'Client ID not configured');

        Log::shouldHaveReceived('channel')
            ->with('oauth')
            ->once();
    }

    /** @test */
    public function oauth_error_page_renders_correctly()
    {
        $this->actingAs($this->user);
        
        $response = $this->get(route('oauth.error', [
            'platform' => 'youtube',
            'channel' => $this->channel->slug,
            'channel_name' => $this->channel->name,
            'message' => 'Test error message',
            'code' => 'test_error',
        ]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('OAuthError')
                ->has('platform')
                ->has('channelSlug')
                ->has('errorMessage')
                ->has('errorCode')
        );
    }

    /** @test */
    public function oauth_redirect_with_invalid_platform_shows_error_page()
    {
        $this->actingAs($this->user);
        
        $response = $this->get("/channels/{$this->channel->slug}/auth/invalid_platform");

        $response->assertRedirect();
        $response->assertRedirectToRoute('oauth.error');
    }

    /** @test */
    public function oauth_callback_with_provider_error_shows_error_page()
    {
        $this->actingAs($this->user);
        
        $response = $this->get("/channels/{$this->channel->slug}/auth/youtube/callback?" . http_build_query([
            'error' => 'access_denied',
            'error_description' => 'User denied access',
        ]));

        $response->assertRedirect();
        $response->assertRedirectToRoute('oauth.error');
    }
} 