# LinkVault Technical Documentation

## 📊 Database Schema
The system uses a relational PostgreSQL database hosted on Supabase to manage users and secure content metadata.

### **Table: `users`**
Manages registered accounts and authentication details.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Unique auto-incrementing identifier. |
| `name` | `VARCHAR(255)` | `NOT NULL` | The user's full display name. |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Unique email used for login. |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt-hashed password. |
| `created_at` | `BIGINT` | `NOT NULL` | Unix timestamp of registration. |

### **Table: `secure_uploads`**
The core engine storing metadata for both encrypted text and file uploads.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(8)` | `PRIMARY KEY` | Unique 8-character URL identifier. |
| `user_id` | `INTEGER` | `REFERENCES users(id)` | Links the upload to a specific user (can be null). |
| `type` | `VARCHAR(10)` | `NOT NULL` | Specifies if content is `'file'` or `'text'`. |
| `content` | `TEXT` | `NOT NULL` | Raw secret text or the storage path. |
| `original_name` | `VARCHAR(255)` | | Original filename for reconstruction. |
| `created_at` | `BIGINT` | `NOT NULL` | Timestamp of link creation. |
| `expires_at` | `BIGINT` | `NOT NULL` | Timestamp for self-destruction. |
| `password_hash` | `TEXT` | | Optional hash for protected access. |
| `max_views` | `INTEGER` | | Maximum view limit before destruction. |
| `view_count` | `INTEGER` | `DEFAULT 0` | Current number of times the link was viewed. |
| `delete_token` | `UUID` | `NOT NULL` | Secret token for manual emergency deletion. |

---

## ⚡ Supabase Connection & Integration
The backend connects to Supabase via the `pg` pool for database operations and the `@supabase/supabase-js` client for storage management.

### **Connection Logic**
The database is initialized using a connection pool configured through environment variables.

* **Host:** `db.[PROJECT-REF].supabase.co`
* **Port:** `5432`
* **User:** `postgres`
* **Libraries:** `pg` (Database) and `dotenv` (Configuration).

### **Storage Workflow**
While text data remains in the PostgreSQL table, file binaries are offloaded to Supabase Storage to ensure the database stays lightweight.

| Step | System Action | Detailed Process |
| :--- | :--- | :--- |
| **1. Ingest** | Multer Middleware | Backend receives file via `multipart/form-data`. |
| **2. Persist** | Supabase Storage | File is sent to a private bucket using `storage.from('bucket').upload()`. |
| **3. Link** | Database Entry | The storage path is saved in the `content` column of `secure_uploads`. |
| **4. Retrieve** | Signed URLs | Backend generates a temporary, time-limited link for the recipient. |
| **5. Purge** | Automatic Cleanup | Expired records are deleted from DB, and the storage path is unlinked. |



---

## 📂 File Storage Schema
To maintain high security and performance, LinkVault Pro separates Metadata from Binaries.

| Feature | Storage Method | Details |
| :--- | :--- | :--- |
| **Text Secrets** | **In-Database** | Stored directly in the `content` column of PostgreSQL. |
| **Files** | **Cloud Bucket** | Binary data is stored in a private Supabase Storage Bucket. |
| **Access Keys** | **Hashed** | Passwords for links are hashed using Bcrypt before DB entry. |
| **Cleanup** | **Cascading** | Deleting a DB record triggers a file deletion in storage. |