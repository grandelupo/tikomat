<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reply from Tikomat Support</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .content {
            padding: 2rem;
        }
        .original-message {
            background-color: #f1f5f9;
            border-left: 4px solid #94a3b8;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 4px 4px 0;
        }
        .reply-message {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 4px 4px 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 1rem 2rem;
            text-align: center;
            font-size: 0.875rem;
            color: #6b7280;
        }
        .badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💌 Reply from Tikomat Support</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Thank you for contacting us. Here's our response.</p>
        </div>
        
        <div class="content">
            <div class="badge">Support Response</div>
            
            <p>Hi {{ $contactMessage->name }},</p>
            
            <div class="reply-message">
                <h3 style="margin: 0 0 0.5rem 0; color: #374151;">Our Response:</h3>
                <p style="margin: 0; white-space: pre-line;">{{ $replyMessage }}</p>
            </div>
            
            <div class="original-message">
                <h4 style="margin: 0 0 0.5rem 0; color: #6b7280;">Your Original Message:</h4>
                <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151;">{{ $contactMessage->subject }}</p>
                <p style="margin: 0; white-space: pre-line; color: #6b7280;">{{ $contactMessage->message }}</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: #9ca3af;">
                    Sent: {{ $contactMessage->created_at->format('F j, Y \a\t g:i A') }}
                </p>
            </div>
            
            <p>If you have any follow-up questions, please don't hesitate to reach out to us again.</p>
            
            <p>Best regards,<br>
            The Tikomat Support Team</p>
        </div>
        
        <div class="footer">
            <p>This email was sent in response to your contact form submission on Tikomat.</p>
            <p>If you didn't expect this email, please contact us at support@tikomat.com</p>
        </div>
    </div>
</body>
</html> 