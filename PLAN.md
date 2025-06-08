# 🎥 Social Media Video Publisher – Requirements (Laravel + Vue + React)

## 🧱 Tech Stack

* **Backend**: Laravel
* **Frontend**:

  * Admin Panel / Dashboard: Vue.js
  * Upload & Scheduling UI: React (e.g. for better UI/UX in scheduling/upload component)
* **Database**: MySQL
* **Queue System**: Laravel Queues (Redis recommended)
* **File Storage**: Local
* **APIs**: OAuth2 / official APIs for YouTube, Instagram, TikTok
* **Scheduler**: Laravel Scheduler + Horizon

---

## 👤 User Flow

1. **Login/Register** to the application.
2. **Connect social media accounts** (YouTube, Instagram, TikTok) via OAuth.
3. Click **“Add Video”** to upload a video file from the local device.
4. System **validates video duration (max 60 seconds)**.

   * If over 60 seconds → show error and block submission.
5. User enters:

   * Video **Title**
   * Video **Description**
6. User selects **platforms** to publish on (checkboxes).
7. User selects **publishing time**:

   * "Publish now"
   * "Schedule for specific date & time"
8. User clicks **Submit**.
9. App:

   * Validates and converts the video to platform-compatible formats.
   * Schedules or publishes video via respective APIs.
10. User sees **status of uploads per platform**:

    * `Pending`, `Uploading`, `Success`, `Failed`
11. If `Failed`, user can **retry upload**.
12. All videos and their statuses remain visible in a **management panel**.

---

## 📃 Database Schema

### `users`

| Field       | Type          | Notes       |
| ----------- | ------------- | ----------- |
| id          | UUID / BIGINT | Primary Key |
| name        | string        |             |
| email       | string        | Unique      |
| password    | string        | Hashed      |
| created\_at | timestamp     |             |
| updated\_at | timestamp     |             |

---

### `social_accounts`

| Field              | Type          | Notes                               |
| ------------------ | ------------- | ----------------------------------- |
| id                 | UUID / BIGINT | Primary Key                         |
| user\_id           | foreignId     | Linked to `users`                   |
| platform           | enum          | \['youtube', 'instagram', 'tiktok'] |
| access\_token      | text          | Encrypted                           |
| refresh\_token     | text          | Optional                            |
| token\_expires\_at | timestamp     |                                     |
| created\_at        | timestamp     |                                     |
| updated\_at        | timestamp     |                                     |

---

### `videos`

| Field                | Type          | Notes             |
| -------------------- | ------------- | ----------------- |
| id                   | UUID / BIGINT | Primary Key       |
| user\_id             | foreignId     | Linked to `users` |
| title                | string        |                   |
| description          | text          |                   |
| original\_file\_path | string        |                   |
| duration             | integer       | Seconds           |
| created\_at          | timestamp     |                   |
| updated\_at          | timestamp     |                   |

---

### `video_targets`

| Field          | Type          | Notes                                           |
| -------------- | ------------- | ----------------------------------------------- |
| id             | UUID / BIGINT | Primary Key                                     |
| video\_id      | foreignId     | Linked to `videos`                              |
| platform       | enum          | \['youtube', 'instagram', 'tiktok']             |
| publish\_at    | timestamp     | Nullable if 'now'                               |
| status         | enum          | \['pending', 'processing', 'success', 'failed'] |
| error\_message | text          | Nullable                                        |
| created\_at    | timestamp     |                                                 |
| updated\_at    | timestamp     |                                                 |

---

## 💠 Features Summary

| Feature                 | Description                                         |
| ----------------------- | --------------------------------------------------- |
| 🔐 Login/Register       | Standard auth with Laravel Breeze/Fortify/Jetstream |
| 🔗 Connect Socials      | OAuth flow for each supported platform              |
| 📄 Upload Video         | Local file upload with validation (max 60s)         |
| 📝 Input Metadata       | Title + description per upload                      |
| ✅ Platform Selection    | Multiselect with checkboxes                         |
| 🗓️ Publish or Schedule | Choose now or select datetime                       |
| ⚙️ Format Conversion    | Transcode video if needed per platform              |
| 🚀 API Upload           | Publish via platform APIs                           |
| 📊 Dashboard            | Status updates in real time                         |
| ♻️ Retry on Failure     | Retry failed uploads manually                       |
| 📁 Video Archive        | List of uploaded videos + statuses                  |
