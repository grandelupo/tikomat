<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Contact Message - Filmate</title>
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
        .message-box {
            background-color: #f1f5f9;
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 4px 4px 0;
        }
        .details {
            background-color: #f8fafc;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .details dt {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        .details dd {
            margin: 0 0 1rem 0;
            color: #6b7280;
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
            <h1>📧 New Contact Message</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Someone has sent a message through the Filmate contact form</p>
        </div>
        
        <div class="content">
            <div class="badge">New Message</div>
            
            <div class="details">
                <dl>
                    <dt>From:</dt>
                    <dd>{{ $contactMessage->name }} ({{ $contactMessage->email }})</dd>
                    
                    <dt>Subject:</dt>
                    <dd>{{ $contactMessage->subject }}</dd>
                    
                    <dt>Submitted:</dt>
                    <dd>{{ $contactMessage->created_at->format('F j, Y \a\t g:i A') }}</dd>
                </dl>
            </div>
            
            <div class="message-box">
                <h3 style="margin: 0 0 0.5rem 0; color: #374151;">Message:</h3>
                <p style="margin: 0; white-space: pre-line;">{{ $contactMessage->message }}</p>
            </div>
            
            @if($contactMessage->user_id)
            <div class="details">
                <dt>User Account:</dt>
                <dd>This message was sent by a registered user (ID: {{ $contactMessage->user_id }})</dd>
            </div>
            @endif
        </div>
        
        <div class="footer">
            <p>This message was sent through the Filmate contact form.</p>
            <p>Reply directly to this email to respond to the sender.</p>
        </div>
    </div>
</body>
</html> 