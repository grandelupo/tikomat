# Instagram OAuth Troubleshooting Guide

This guide helps resolve common Instagram OAuth connection issues, particularly the "Invalid platform app" error.

## Common Error: "Invalid platform app" (Nieprawidłowe żądanie)

This error typically occurs when there's a configuration mismatch between your application and the Instagram/Facebook app settings.

### Root Causes

1. **Facebook App Configuration Issues**
   - Instagram OAuth actually uses Facebook's OAuth system
   - Your Facebook app must be properly configured for Instagram access
   - App must be approved for Instagram Business API or Instagram Basic Display

2. **Redirect URL Mismatch**
   - The redirect URL in your app must exactly match the one configured in Facebook Developer Console
   - Even small differences (http vs https, trailing slash, etc.) will cause this error

3. **Missing Instagram Product Configuration**
   - The Facebook app must have Instagram products added and configured
   - Appropriate permissions must be requested and approved

4. **Environment Configuration Issues**
   - Missing or incorrect Client ID/Secret
   - Wrong redirect URLs in environment variables

## Step-by-Step Resolution

### 1. Verify Facebook Developer Console Setup

1. **Go to [Facebook Developer Console](https://developers.facebook.com/)**
2. **Select your app** (or create one if you don't have it)
3. **Add Instagram Product:**
   - Go to "Add a Product" 
   - Add "Instagram Basic Display" or "Instagram Business API" (depending on your needs)
4. **Configure Instagram Settings:**
   - Set up redirect URIs exactly as configured in your app
   - Ensure all required permissions are added

### 2. Check Environment Variables

Verify these environment variables in your `.env` file:

```bash
# Instagram OAuth (usually uses Facebook app)
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# Facebook OAuth (may be needed for Instagram)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

### 3. Verify Redirect URLs

Your redirect URLs should match exactly:

**In your app config (`config/services.php`):**
```php
'instagram' => [
    'client_id' => env('INSTAGRAM_CLIENT_ID'),
    'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
    'redirect' => rtrim(env('APP_URL'), '/') . '/auth/instagram/callback',
],
```

**In Facebook Developer Console:**
- Go to Instagram Product settings
- Add the exact same URL: `https://yourdomain.com/auth/instagram/callback`

### 4. Instagram Business API vs Basic Display

**For Content Publishing (recommended):**
- Use Instagram Business API
- Requires business Instagram account
- Must be connected to a Facebook page
- Needs app review for production

**For Basic Access:**
- Use Instagram Basic Display
- Limited to reading user data
- Easier to set up for development

### 5. App Review and Permissions

If using Instagram Business API for production:

1. **Submit for App Review:**
   - Go to Facebook Developer Console
   - Submit your app for review
   - Include detailed use case description

2. **Required Permissions:**
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`

### 6. Testing Configuration

Use the debug endpoint (development only):
```bash
GET /oauth/debug/instagram
```

This will show:
- Configuration status
- Missing credentials
- Instagram-specific issues

## Development vs Production

### Development Setup
- Use test Instagram accounts
- Facebook app can remain in "Development" mode
- Limited to app developers and testers

### Production Setup
- Requires app review and approval
- Must use business Instagram accounts
- All permissions must be approved by Meta

## Common Configuration Mistakes

1. **Using Instagram credentials instead of Facebook:**
   ```bash
   # WRONG - Instagram doesn't have separate OAuth
   INSTAGRAM_CLIENT_ID=instagram_specific_id
   
   # CORRECT - Use Facebook app credentials
   INSTAGRAM_CLIENT_ID=your_facebook_app_id
   ```

2. **Redirect URL mismatch:**
   ```bash
   # App config has: https://yourapp.com/auth/instagram/callback
   # Facebook has: https://yourapp.com/auth/instagram/callback/
   # These don't match! Remove the trailing slash
   ```

3. **Wrong Instagram product:**
   ```bash
   # For content publishing, use Instagram Business API
   # For basic data access, use Instagram Basic Display
   ```

## Testing Your Configuration

1. **Check environment variables:**
   ```bash
   php artisan tinker
   config('services.instagram')
   ```

2. **Test OAuth configuration:**
   ```bash
   # Visit (development only):
   GET /oauth/debug/instagram
   ```

3. **Check Facebook app status:**
   - Ensure app is "Live" for production
   - Verify all Instagram products are added
   - Check app review status

## Additional Resources

- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Business API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)

## Still Having Issues?

If you're still experiencing problems:

1. **Check the OAuth logs:**
   ```bash
   tail -f storage/logs/oauth.log
   ```

2. **Verify Instagram account type:**
   - Personal accounts: Use Instagram Basic Display
   - Business accounts: Use Instagram Business API

3. **Contact Support:**
   - Include the full error message
   - Provide your Facebook app ID (not secret)
   - Include screenshots of your Facebook app configuration 