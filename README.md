# 🔒 LinkVault

LinkVault is a privacy-focused file and text sharing platform. It allows users to create secure, self-destructing links with custom expiration timers, view limits, and password protection.

## ✨ Features
* **Dual Mode Sharing**: Effortlessly share both files (up to 30MB) and secret texts.
* **Self-Destruct Timers**: Set links to expire in as little as 10 seconds or up to a custom date/time.
* **Privacy Controls**: Optional password protection and view-count limits.
* **Premium UI**: A sleek, modern dark-mode interface with 3D folder animations and drag-and-drop support.
* **User Dashboard**: Registered users can track, manage, and delete their active links.
* **Instant Deletion**: Immediate "Destroy Link" option available for every generated link.

---

## 🚀 Setup Instructions

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **PostgreSQL** Database (Local or Supabase)
* **NPM** or **Yarn**

### 2. Database Initialization
Run the following SQL commands in your database editor to set up the required tables as defined in your storage logic:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE secure_uploads (
    id VARCHAR(8) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    original_name VARCHAR(255),
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    password_hash TEXT,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    delete_token UUID NOT NULL
);
```
### 3. Backend Setup
1.  Navigate to the backend folder: `cd backend`.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file and add your credentials.
```env
DB_USER=your_user
DB_HOST=your_host
DB_NAME=your_db_name
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_secret_key
```
4.Start development server: npm run dev.

### 4. Frontend Setup

1. Navigate to the frontend folder: `cd frontend`.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.

### 5.API Overview

The application utilizes the following core endpoints managed via the Store logic:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Create a new user account with name, email, and password. |
| **POST** | `/api/auth/login` | Authenticate and receive a JWT. |
| **POST** | `/api/upload/text` | Create a secure text link. |
| **POST** | `/api/upload/file` | Upload a file and receive a secure link. |
| **GET** | `/api/content/:id` | Retrieve shared content (requires password if set). |
| **GET** | `/api/history` | Fetch link history for logged-in users. |
| **DELETE** | `/api/delete/:id` | Permanently destroy a link using a delete token. |

## 📂 File Storage Schema
To maintain high security and performance, LinkVault Pro separates Metadata from Binaries.

| Feature | Storage Method | Details |
| :--- | :--- | :--- |
| **Text Secrets** | In-Database | Stored directly in the content column of PostgreSQL. |
| **Files** | Cloud Bucket | Binary data is stored in a private Supabase Storage Bucket. |
| **Access Keys** | Hashed | Passwords for links are hashed using Bcrypt before DB entry. |
| **Cleanup** | Cascading | Deleting a DB record triggers a file deletion in storage. |

## 🎨 Design Decisions

### Architecture: Metadata vs. Binaries

To maintain high performance, the system separates Metadata from Binaries. Small text secrets are stored directly in the PostgreSQL database, while large file binaries are offloaded to Supabase Storage (via the `@supabase/supabase-js` client) to keep the database lightweight.

### UI/UX: The "Keepish" Aesthetic
The application uses a deep slate-black theme with vibrant indigo accents.

* **Interactive States**: Buttons lift and glow on hover to provide immediate feedback.
* **Dropzone Animation**: The file upload area features 3D layered folder graphics that react to drag-and-drop actions.
* **Frontend Validation**: File sizes are checked instantly on the client side (30MB limit) to save user bandwidth.

### Security: Zero-Trace Infrastructure
* **Bcrypt Hashing**: User passwords and link access passwords are salted and hashed.
* **Manual Destruction**: A `delete_token` is generated for every link, allowing creators to destroy content regardless of expiration.
* **Automated Cleanup**: Background jobs (via `deleteExpired`) identify expired rows and physically delete associated files from storage.

## ⚠️ Assumptions and Limitations
* **Storage Limit**: File uploads are limited to 30MB to optimize server resources.
* **Persistence**: Links are "one-way"—once deleted (manually or via expiry), data is unrecoverable.
* **Browser Compatibility**: Native HTML5 date pickers are used, which format according to the user's OS locale (e.g., `dd/mm/yyyy` in India).
* **Network Dependency**: Real-time view tracking and self-destruct countdowns require an active internet connection to poll the API.