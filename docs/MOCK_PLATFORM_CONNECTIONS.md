# Mock Platform Connections for Development

This document explains how to use mock platform connections for testing in local development mode.

## Overview

When developing locally (with `APP_ENV=local` in your `.env` file), you can create mock connections to social media platforms without needing actual OAuth credentials. This allows you to test the full platform connection workflow and upload functionality without connecting to real social media accounts.

## Features

### Mock Connection Creation
- **Test Connect Buttons**: In local mode, you'll see orange "Test Connect" buttons alongside regular connect buttons
- **Mock Data Generation**: Creates realistic test data for each platform including usernames, channel IDs, and profile information
- **Platform-Specific Data**: Each platform gets appropriate mock data (YouTube channels, TikTok usernames, etc.)

### Visual Indicators
- **Mock Badges**: Connected mock accounts display an orange "Mock" badge with a test tube icon
- **Development Mode Alert**: A blue alert banner appears at the top of the connections page explaining the feature
- **Orange Styling**: Test connect buttons and mock indicators use orange theming to distinguish from real connections

## How to Use

### 1. Ensure Local Environment
Make sure your `.env` file contains:
```env
APP_ENV=local
```

### 2. Navigate to Platform Connections
Go to either:
- **Connections Page**: `/connections` - Overview of all platform connections across channels
- **Channel Page**: `/channels/{channel-slug}` - Platform connections for a specific channel

### 3. Create Mock Connections
1. Look for the orange "Test Connect" buttons (only visible in local mode)
2. Click "Test Connect" for any platform you want to mock
3. Confirm the action in the popup dialog
4. The mock connection will be created instantly

### 4. Identify Mock Connections
Mock connections are clearly marked with:
- Orange "Mock" badge next to the platform name
- Test tube icon
- "(Development Mode)" in success messages

## Mock Data Generated

Each platform receives realistic test data:

### YouTube
- Channel ID: `UCtest{random_numbers}`
- Channel Name: "Dev Test Channel"
- Handle: "@devtestchannel"
- Channel URL: `https://www.youtube.com/channel/{channel_id}`

### TikTok
- Channel ID: `test_tiktok_{random_numbers}`
- Channel Name: "DevTestTikTok"
- Handle: "@devtesttiktok"
- Profile URL: `https://www.tiktok.com/@devtesttiktok`

### Instagram
- Channel ID: `test_instagram_{random_numbers}`
- Username: "devtestinstagram"
- Handle: "@devtestinstagram"
- Profile URL: `https://www.instagram.com/devtestinstagram`

### Facebook
- Page ID: `{random_9_digit_number}`
- Page Name: "Dev Test Facebook Page"
- Page URL: `https://www.facebook.com/{page_id}`

### X (Twitter)
- Channel ID: `test_x_{random_numbers}`
- Username: "DevTestX"
- Handle: "@devtestx"
- Profile URL: `https://x.com/devtestx`

### Snapchat
- Channel ID: `test_snap_{random_numbers}`
- Username: "DevTestSnap"
- Handle: "@devtestsnap"
- Profile URL: `https://www.snapchat.com/add/devtestsnap`

### Pinterest
- Channel ID: `test_pinterest_{random_numbers}`
- Username: "DevTestPinterest"
- Handle: "@devtestpinterest"
- Profile URL: `https://www.pinterest.com/devtestpinterest`

## Backend Implementation

Mock connections are identified by:
- Access Token: `'fake_token_for_development'`
- Refresh Token: `'fake_refresh_token'`
- Token Expiry: 30 days from creation
- Realistic platform-specific metadata

The system automatically detects mock connections in various services and provides appropriate fallback behavior for API calls.

## Testing Upload Workflows

Mock connections can be used to test:
- Video upload job dispatching
- Platform-specific upload logic
- Error handling and retry mechanisms
- Upload status tracking
- Multi-platform publishing workflows

The upload jobs will recognize mock tokens and simulate successful uploads without making actual API calls to social media platforms.

## Security

Mock connections are only available in local development mode (`APP_ENV=local`). Any attempt to create mock connections in production will be rejected with an error message.

## Disconnecting Mock Connections

Mock connections can be disconnected the same way as real connections:
1. Click the disconnect button on the connection card
2. Confirm the action in the popup dialog
3. The mock connection will be removed from the database

## Troubleshooting

### Test Connect Buttons Not Showing
- Verify `APP_ENV=local` in your `.env` file
- Clear your browser cache and reload the page
- Check that you're accessing the application locally

### Mock Connection Creation Fails
- Ensure your local database is properly configured
- Check Laravel logs for any database errors
- Verify the social accounts table exists and is up to date

### Mock Data Not Displaying
- Refresh the page after creating a mock connection
- Check that the connection was successfully created in the database
- Verify the mock detection logic is working (access_token = 'fake_token_for_development')

## Related Files

- **Backend**: `app/Http/Controllers/SocialAccountController.php` - Mock connection creation
- **Frontend**: `resources/js/pages/Connections.tsx` - Connections overview with mock indicators
- **Frontend**: `resources/js/pages/Channel/Show.tsx` - Channel-specific connections with mock support
- **Types**: `resources/js/types/index.d.ts` - SharedData interface with app environment
- **Routes**: `routes/web.php` - Mock connection route definition
