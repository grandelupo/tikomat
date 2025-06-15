<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New Chat Message - Tikomat Admin</title>
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
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
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
            background-color: #f0f9ff;
            border-left: 4px solid #10b981;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 4px 4px 0;
        }
        .user-info {
            background-color: #f8fafc;
            padding: 1rem;
            border-radius: 6px;
            margin: 1rem 0;
        }
        .user-info dt {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        .user-info dd {
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
            background-color: #dcfce7;
            color: #166534;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 New Chat Message</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">A user has sent a new message in the support chat</p>
        </div>
        
        <div class="content">
            <div class="badge">Chat Support</div>
            
            <div class="user-info">
                <dl>
                    <dt>User:</dt>
                    <dd>{{ $chatMessage->user->name }} ({{ $chatMessage->user->email }})</dd>
                    
                    <dt>User ID:</dt>
                    <dd>{{ $chatMessage->user->id }}</dd>
                    
                    <dt>Sent:</dt>
                    <dd>{{ $chatMessage->created_at->format('F j, Y \a\t g:i A') }}</dd>
                </dl>
            </div>
            
            <div class="message-box">
                <h3 style="margin: 0 0 0.5rem 0; color: #374151;">Message:</h3>
                <p style="margin: 0; white-space: pre-line;">{{ $chatMessage->message }}</p>
            </div>
            
            <div style="text-align: center; margin: 2rem 0;">
                <a href="{{ config('app.url') }}/admin/chat/{{ $chatMessage->user->id }}" class="btn">
                    Reply in Admin Panel
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p>This message was sent through the Tikomat chat system.</p>
            <p>Log in to the admin panel to view the full conversation and reply.</p>
        </div>
    </div>
</body>
</html> 