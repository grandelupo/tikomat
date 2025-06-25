# Instagram OAuth Troubleshooting Guide

This guide helps resolve common Instagram OAuth connection issues and covers the migration to the new Instagram API with Instagram Login.

## ⚠️ IMPORTANT: Instagram API Migration Required

**As of January 27, 2025, Instagram is deprecating the old scope values.** You must migrate to the new Instagram API with Instagram Login.

### New Scope Values (Required)
- `instagram_business_basic` (replaces `instagram_basic`)
- `instagram_business_content_publish` (replaces `instagram_content_publish`)
- `instagram_business_manage_comments` (for comment management)
- `instagram_business_manage_messages` (for messaging - optional)

### Deprecated Scope Values (Remove Before Jan 27, 2025)
- ❌ `instagram_basic` → Use `instagram_business_basic`
- ❌ `instagram_content_publish` → Use `instagram_business_content_publish`
- ❌ `business_basic` → Use `instagram_business_basic`
- ❌ `business_content_publish` → Use `instagram_business_content_publish`
- ❌ `business_manage_comments` → Use `instagram_business_manage_comments`
- ❌ `business_manage_messages` → Use `instagram_business_manage_messages`

## New Instagram API Features

The Instagram API with Instagram Login provides:
- **Content publishing** – Publish media to Instagram
- **Comment moderation** – Manage and reply to comments
- **Media Insights** – Get insights on media performance
- **Mentions** – Identify where you've been @mentioned
- **Messaging** – Send and receive messages (optional)
- **No Facebook Page Required** – Direct Instagram professional account connection

## Common Error: "Invalid platform app" (Nieprawidłowe żądanie)

This error typically occurs when there's a configuration mismatch between your application and the Instagram/Facebook app settings.

### Root Causes

1. **Facebook App Configuration Issues**
   - Instagram OAuth uses Facebook's infrastructure
   - Your Facebook app must be configured for Instagram API with Instagram Login
   - App must be approved for Instagram Business API

2. **Outdated Scope Values**
   - Using deprecated scopes (`instagram_basic`, `instagram_content_publish`)
   - Must migrate to new business scopes before January 27, 2025

3. **Redirect URL Mismatch**
   - The redirect URL in your app must exactly match the one configured in Facebook Developer Console
   - Even small differences (http vs https, trailing slash, etc.) will cause this error

4. **Missing Instagram Product Configuration**
   - The Facebook app must have "Instagram API with Instagram Login" product added
   - Appropriate permissions must be requested and approved

5. **Account Type Mismatch**
   - Instagram API with Instagram Login requires Instagram Professional accounts (Business or Creator)
   - Personal Instagram accounts are not supported

## Step-by-Step Resolution

### 1. Verify Facebook Developer Console Setup

1. **Go to [Facebook Developer Console](https://developers.facebook.com/)**
2. **Select your app** (or create one if you don't have it)
3. **Add Instagram Product:**
   - Go to "Add a Product" 
   - Add **"Instagram API with Instagram Login"** (NOT Instagram Basic Display)
4. **Configure Instagram Settings:**
   - Set up redirect URIs exactly as configured in your app
   - Ensure all required permissions are added with new scope values

### 2. Check Environment Variables

Verify these environment variables in your `.env` file:

```bash
# Instagram OAuth (uses Facebook app with new API)
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret

# Facebook OAuth (may be needed for page management)
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
- Go to Instagram API with Instagram Login settings
- Add the exact same URL: `https://yourdomain.com/auth/instagram/callback`

### 4. Instagram Professional Account Requirements

**Requirements for Instagram API with Instagram Login:**
- Instagram account must be Professional (Business or Creator)
- Account must be in good standing
- No Facebook Page linking required (unlike old API)

**To Convert to Professional Account:**
1. Open Instagram app
2. Go to Settings → Account → Switch to Professional Account
3. Choose Business or Creator
4. Complete the setup process

### 5. App Review and Permissions

For production use:

1. **Submit for App Review:**
   - Go to Facebook Developer Console
   - Submit your app for review with new Instagram API
   - Include detailed use case description

2. **Required Permissions (New Scopes):**
   - `instagram_business_basic` (essential)
   - `instagram_business_content_publish` (for publishing)
   - `instagram_business_manage_comments` (for comments)
   - `instagram_business_manage_messages` (for messaging - optional)
   - `pages_show_list` (if Facebook page integration needed)
   - `pages_read_engagement` (for engagement data)

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
- Use test Instagram Professional accounts
- Facebook app can remain in "Development" mode
- Limited to app developers and testers
- Test with new scope values

### Production Setup
- Requires app review and approval for new Instagram API
- Must use real Instagram Professional accounts
- All new permissions must be approved by Meta
- Migration from old scopes must be completed before Jan 27, 2025

## Migration Checklist

- [ ] Update Facebook app to use "Instagram API with Instagram Login"
- [ ] Replace deprecated scopes with new business scopes
- [ ] Ensure Instagram accounts are Professional (Business/Creator)
- [ ] Test OAuth flow with new scopes
- [ ] Submit app for review with new permissions
- [ ] Remove old scope references from code and documentation
- [ ] Update user-facing instructions for Professional account requirement

## Common Configuration Mistakes

1. **Using deprecated scopes:**
   ```bash
   # WRONG - Deprecated scopes (will fail after Jan 27, 2025)
   'instagram_content_publish', 'instagram_basic'
   
   # CORRECT - New business scopes
   'instagram_business_content_publish', 'instagram_business_basic'
   ```

2. **Using Instagram Basic Display instead of Instagram API with Instagram Login:**
   ```bash
   # WRONG - Instagram Basic Display (limited functionality)
   # CORRECT - Instagram API with Instagram Login (full business features)
   ```

3. **Personal Instagram accounts:**
   ```bash
   # WRONG - Personal Instagram accounts not supported
   # CORRECT - Must use Instagram Professional (Business/Creator) accounts
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
   - Ensure app uses "Instagram API with Instagram Login"
   - Verify all new business scopes are added
   - Check app review status for production use

## Additional Resources

- [Instagram API with Instagram Login Documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Instagram API Migration Guide](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)

## Still Having Issues?

If you're still experiencing problems:

1. **Check the OAuth logs:**
   ```bash
   tail -f storage/logs/oauth.log
   ```

2. **Verify Instagram account type:**
   - Must be Professional (Business or Creator) account
   - Personal accounts will not work with new API

3. **Check scope migration:**
   - Ensure you're using new business scopes
   - Remove all deprecated scope references

4. **Contact Support:**
   - Include the full error message
   - Provide your Facebook app ID (not secret)
   - Include screenshots of your Facebook app configuration
   - Confirm you're using Instagram API with Instagram Login (not Basic Display) 