<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e9ecef;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
            margin-bottom: 20px;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
        }
        .info-value {
            color: #212529;
        }
        .message-box {
            background: white;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
        }
        .status-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 New Contact Form Submission</h1>
        <p>Someone has sent a message through your Filmate contact form</p>
    </div>

    <div class="content">
        <div class="info-grid">
            <div class="info-label">Name:</div>
            <div class="info-value">{{ $contactMessage->full_name }}</div>
            
            <div class="info-label">Email:</div>
            <div class="info-value">
                <a href="mailto:{{ $contactMessage->email }}">{{ $contactMessage->email }}</a>
            </div>
            
            <div class="info-label">Subject:</div>
            <div class="info-value">{{ $contactMessage->subject }}</div>
            
            <div class="info-label">Status:</div>
            <div class="info-value">
                <span class="status-badge">{{ ucfirst($contactMessage->status) }}</span>
            </div>
            
            <div class="info-label">Submitted:</div>
            <div class="info-value">{{ $contactMessage->created_at->format('M j, Y \a\t g:i A') }}</div>
        </div>

        <div class="message-box">
            <h3>Message:</h3>
            <p>{{ nl2br(e($contactMessage->message)) }}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ config('app.url') }}/admin/contact-messages/{{ $contactMessage->id }}" class="btn">
                View in Admin Panel
            </a>
            <br>
            <a href="mailto:{{ $contactMessage->email }}?subject=Re: {{ $contactMessage->subject }}" class="btn">
                Reply Directly
            </a>
        </div>
    </div>

    <div class="footer">
        <p>This email was sent automatically when someone submitted the contact form on your Filmate website.</p>
        <p>
            <strong>Filmate</strong> - The easiest way to publish videos across all social media platforms<br>
            <a href="{{ config('app.url') }}">{{ config('app.url') }}</a>
        </p>
    </div>
</body>
</html> 