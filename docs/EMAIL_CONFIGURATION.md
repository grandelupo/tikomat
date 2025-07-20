# Email Configuration

This document outlines the email configuration system and how to manage email addresses displayed to users throughout the application.

## Overview

All email addresses shown to users are now centralized using the `PUBLIC_EMAIL` environment variable. This ensures consistency across the application and makes it easy to update contact information.

## Environment Variable

### `PUBLIC_EMAIL`

This is the primary email address used for all user-facing contact information.

**Usage:**
```bash
PUBLIC_EMAIL=support@yourdomain.com
```

**Default fallback:** If not set, the system will use appropriate default addresses for different contexts.

## Frontend Implementation

### React Components

All frontend components now use `import.meta.env.VITE_PUBLIC_EMAIL` to access the email address:

```tsx
// Example usage in React components
<p>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'support@tikomat.com'}</p>
```

### Files Updated

1. **`resources/js/pages/Legal/Privacy.tsx`**
   - Contact information in "Your Rights and Choices" section
   - Contact information in "Contact Information" section

2. **`resources/js/pages/Legal/DataDeletion.tsx`**
   - Email address in data deletion request instructions
   - Contact information in "Contact Information" section

3. **`resources/js/pages/Legal/Terms.tsx`**
   - Contact information in "Contact Information" section

4. **`resources/js/pages/Contact.tsx`**
   - Email support contact information

## Backend Implementation

### PHP Controllers

Backend code uses `env('PUBLIC_EMAIL')` to access the email address:

```php
// Example usage in PHP
$email = env('PUBLIC_EMAIL', 'support@tikomat.com');
```

### Files Updated

1. **`app/Http/Controllers/ContactController.php`**
   - Admin email notifications
   - Error message contact information

2. **`config/mail.php`**
   - Admin email configuration

3. **`resources/views/emails/contact-reply.blade.php`**
   - Footer contact information in email templates

## Configuration

### Environment Setup

Add the following to your `.env` file:

```env
# Public contact email (shown to users)
PUBLIC_EMAIL=support@yourdomain.com

# Optional: Specific email addresses for different purposes
VITE_CONTACT_EMAIL=support@yourdomain.com
VITE_CONTACT_PHONE=+1-555-123-4567
```

### Vite Configuration

The `VITE_PUBLIC_EMAIL` variable is automatically available in frontend components through Vite's environment variable handling.

## Email Templates

### Updated Templates

1. **`contact-reply.blade.php`**
   - Footer contact information now uses `{{ env('PUBLIC_EMAIL', 'support@tikomat.com') }}`

### Unchanged Templates

The following email templates don't contain hardcoded email addresses and don't need updates:
- `contact-form-submitted.blade.php`
- `admin-message-notification.blade.php`
- `new-contact-message.blade.php`

## Usage Examples

### Frontend (React/TypeScript)

```tsx
// In any React component
const contactEmail = import.meta.env.VITE_PUBLIC_EMAIL || 'support@tikomat.com';

return (
    <div>
        <p>Contact us at: {contactEmail}</p>
        <a href={`mailto:${contactEmail}`}>Send Email</a>
    </div>
);
```

### Backend (PHP)

```php
// In any PHP file
$contactEmail = env('PUBLIC_EMAIL', 'support@tikomat.com');

// In Blade templates
<p>Contact us at: {{ env('PUBLIC_EMAIL', 'support@tikomat.com') }}</p>
```

## Migration Guide

### Before (Hardcoded)

```tsx
// Old way - hardcoded email
<p>Email: support@tikomat.com</p>
```

```php
// Old way - hardcoded email
$email = 'support@tikomat.com';
```

### After (Environment Variable)

```tsx
// New way - environment variable
<p>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'support@tikomat.com'}</p>
```

```php
// New way - environment variable
$email = env('PUBLIC_EMAIL', 'support@tikomat.com');
```

## Benefits

1. **Centralized Management**: All email addresses in one place
2. **Easy Updates**: Change email address by updating one environment variable
3. **Environment Flexibility**: Different emails for different environments
4. **Consistency**: Same email address used everywhere
5. **Maintainability**: No need to search and replace hardcoded emails

## Testing

### Frontend Testing

1. Set `PUBLIC_EMAIL` in your `.env` file
2. Run `npm run build` to ensure compilation succeeds
3. Check that the email appears correctly in all components

### Backend Testing

1. Set `PUBLIC_EMAIL` in your `.env` file
2. Test contact form submission
3. Verify email templates use the correct address

## Troubleshooting

### Email Not Showing

1. Check that `PUBLIC_EMAIL` is set in your `.env` file
2. Ensure the environment variable is accessible (no typos)
3. Clear any caches: `php artisan config:clear`

### Build Errors

1. Ensure all TypeScript files use the correct syntax
2. Check that fallback values are provided
3. Run `npm run build` to identify any compilation issues

## Security Considerations

- The `PUBLIC_EMAIL` is intended for user-facing contact information
- Don't use this for sensitive internal email addresses
- Consider using different email addresses for different environments (dev, staging, production)

## Future Enhancements

Consider implementing:

1. **Multiple Email Types**: Separate variables for support, privacy, legal, etc.
2. **Email Validation**: Ensure the environment variable contains a valid email format
3. **Fallback Chain**: Multiple fallback options for different contexts
4. **Email Templates**: Centralized email template management 