# 🎥 Social Media Video Publisher

A Laravel + React application for uploading and publishing videos across multiple social media platforms (YouTube, Instagram, TikTok).

## ✨ Features

- **Video Upload**: Upload videos with 60-second duration limit
- **Multi-Platform Publishing**: Publish to YouTube, Instagram, and TikTok
- **OAuth Integration**: Connect social media accounts securely
- **Scheduling**: Publish immediately or schedule for later
- **Status Tracking**: Real-time status updates for each platform
- **Retry Mechanism**: Retry failed uploads
- **Modern UI**: Beautiful React interface with Tailwind CSS

## 🛠️ Tech Stack

- **Backend**: Laravel 12
- **Frontend**: React 19 + Inertia.js
- **Database**: SQLite (configurable)
- **UI**: Tailwind CSS + Radix UI components
- **Video Processing**: FFMpeg
- **OAuth**: Laravel Socialite
- **Queue System**: Laravel Queues

## 📋 Requirements

- PHP 8.2+
- Node.js 18+
- Composer
- FFMpeg (for video processing)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd filmate
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**
   ```bash
   php artisan migrate
   ```

6. **Install FFMpeg** (for video processing)
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu**: `sudo apt install ffmpeg`
   - **Windows**: Download from [FFMpeg website](https://ffmpeg.org/download.html)

## ⚙️ Configuration

### OAuth Setup

Add the following to your `.env` file:

```env
# Google (YouTube)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# TikTok
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### OAuth Provider Setup

#### YouTube (Google)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:8000/auth/youtube/callback`

#### Instagram
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Configure OAuth redirect URI: `http://localhost:8000/auth/instagram/callback`

#### TikTok
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Configure OAuth settings
4. Add redirect URI: `http://localhost:8000/auth/tiktok/callback`

## 🏃‍♂️ Running the Application

1. **Start the development servers**
   ```bash
   # Terminal 1: Laravel server
   php artisan serve

   # Terminal 2: Vite dev server
   npm run dev

   # Terminal 3: Queue worker (for background jobs)
   php artisan queue:work
   ```

2. **Access the application**
   - Open your browser to `http://localhost:8000`
   - Register a new account or login
   - Connect your social media accounts
   - Start uploading videos!

## 📁 Project Structure

```
├── app/
│   ├── Http/Controllers/
│   │   ├── DashboardController.php
│   │   ├── VideoController.php
│   │   └── SocialAccountController.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Video.php
│   │   ├── VideoTarget.php
│   │   └── SocialAccount.php
│   ├── Policies/
│   │   └── VideoPolicy.php
│   └── Services/
│       └── VideoProcessingService.php
├── database/migrations/
├── resources/js/
│   ├── components/ui/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   └── Videos/
│   │       ├── Create.tsx
│   │       └── Index.tsx
│   └── layouts/
└── routes/web.php
```

## 🎯 Usage

### 1. Connect Social Accounts
- Navigate to the Dashboard
- Click "Connect" for each platform you want to use
- Complete the OAuth flow

### 2. Upload a Video
- Click "Upload Video" button
- Select a video file (max 60 seconds, 100MB)
- Enter title and description
- Select target platforms
- Choose to publish now or schedule for later
- Submit the form

### 3. Monitor Status
- View upload progress and status on the Dashboard
- See real-time updates for each platform
- Retry failed uploads if needed

## 🔧 Development

### Database Schema

- **users**: User accounts
- **social_accounts**: OAuth tokens for connected platforms
- **videos**: Uploaded video metadata
- **video_targets**: Platform-specific publishing targets

### Key Components

- **VideoProcessingService**: Handles video upload and validation
- **SocialAccountController**: Manages OAuth flows
- **VideoController**: Handles video CRUD operations
- **Dashboard**: Main interface showing videos and connections

## 🚀 Deployment

1. **Production Environment**
   ```bash
   composer install --optimize-autoloader --no-dev
   npm run build
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

2. **Queue Worker**
   - Set up a process manager (Supervisor) for queue workers
   - Configure proper logging and error handling

3. **File Storage**
   - Configure cloud storage (S3, etc.) for production
   - Update `config/filesystems.php` accordingly

## 📝 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue on GitHub or contact the development team. 