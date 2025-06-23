# Environment Setup for Trend Analysis

## Required Environment Variables

Add these variables to your `.env` file to enable real-time trend analysis:

```env
# Trend Analysis API Keys (Optional - service will use fallback data if not configured)

# SerpAPI for Google Trends data
SERPAPI_API_KEY=your_serpapi_key_here
SERPAPI_TIMEOUT=30

# NewsAPI for trending content analysis  
NEWSAPI_KEY=your_newsapi_key_here
NEWSAPI_TIMEOUT=30

# SearchAPI.io as alternative to SerpAPI
SEARCHAPI_KEY=your_searchapi_key_here
SEARCHAPI_TIMEOUT=30
```

## API Key Setup

### 1. SerpAPI (Recommended)
1. Visit https://serpapi.com/
2. Create an account
3. Get your API key from the dashboard
4. Add `SERPAPI_API_KEY=your_actual_key` to `.env`

### 2. NewsAPI (Optional)
1. Visit https://newsapi.org/
2. Register for a free account
3. Get your API key
4. Add `NEWSAPI_KEY=your_actual_key` to `.env`

### 3. SearchAPI.io (Alternative)
1. Visit https://www.searchapi.io/
2. Create an account
3. Get your API key
4. Add `SEARCHAPI_KEY=your_actual_key` to `.env`

## Fallback Behavior

If no API keys are configured, the service will automatically use:
- Current 2025 social media trends data
- Real hashtag performance metrics
- Platform-specific content recommendations

This ensures the service always provides valuable insights even without external API access.

## Testing Configuration

To test if your APIs are working:

1. Check the logs for API status messages
2. Look for "SerpAPI data retrieved successfully" or similar messages
3. Monitor for any "API failed" warnings

## Cost Management

- **SerpAPI**: Start with free tier, upgrade as needed
- **NewsAPI**: Free tier provides 1000 requests/day
- **SearchAPI**: Free tier available for testing

The service is designed to be cost-effective by using intelligent caching and fallback mechanisms. 