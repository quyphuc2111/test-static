# Static Content Server - Node Version 22

## 📝 Mô tả

Hệ thống quản lý và phân phối nội dung HTML/SCORM tĩnh với các tính năng:

1. **Upload & Host**: Upload các folder đã được zip lại (HTML/SCORM)
2. **Auto Extract**: Tự động giải nén và host HTML tĩnh
3. **Content Management**: Quản lý CRUD đầy đủ cho các item
4. **Role-Based Access Control**: Phân quyền chi tiết theo vai trò
5. **Content Sharing**: Chia sẻ nội dung giữa các user với quyền tùy chỉnh
6. **Testing**: Tester có thể test trực tiếp các module

## 🚀 Cài đặt

### 1. Clone Repository

```bash
git clone <repository-url>
cd static_content_server
```

### 2. Cài đặt Dependencies

```bash
pnpm install
```

### 3. Cấu hình Environment

Tạo file `.env` từ `.env.example`:

```bash
cp env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
DATABASE_URL="mysql://user:password@host:port/database"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
SESSION_COOKIE_NAME="bkt_session"
SESSION_PASSWORD=dev-secret-change-me-dev-secret-change-me
```

### 4. Prisma Setup

#### a. Generate Prisma Client

```bash
npx prisma generate
```

#### b. Run Migrations

```bash
npx prisma db push
```

Hoặc nếu muốn reset database (⚠️ sẽ xóa toàn bộ data):

```bash
npx prisma db push --force-reset
```

#### c. Seed Database

```bash
npm run prisma:seed
```

Lệnh này sẽ:
- Tạo các permissions mặc định
- Tạo các roles (ADMINISTRATOR, DEVELOPER, TESTER)
- Tạo user admin mặc định (nếu chưa có)

### 5. Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

## 📦 Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm start` | Chạy production server |
| `npm run lint` | Lint code |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma db push` | Push schema changes to DB |
| `npx prisma migrate reset` | Reset database và chạy migrations |
| `npm run prisma:seed` | Seed database với data mặc định |
| `npx prisma studio` | Mở Prisma Studio (GUI quản lý DB) |

## 👥 Accounts Mặc định

Sau khi seed, bạn có thể login với:

- **Admin**: Kiểm tra trong seed script hoặc tạo mới qua database

## 🏗️ Cấu trúc Project

```
/src
  /app              # Next.js App Router
    /api            # API routes
    /(manager)      # Protected manager routes
  /components       # React components
  /lib              # Utilities & helpers
  /modules          # Feature modules (services, hooks)
  /constants        # Constants & configs
/prisma
  /schema.prisma    # Database schema
  /seed-rbac.js     # RBAC seed script
  /migrations       # Migration files
/public
  /uploads          # Uploaded content storage
```

## 🔑 Permissions System

### Roles Mặc định:

1. **ADMINISTRATOR**: Full quyền
2. **DEVELOPER**: Quản lý nội dung, upload, share
3. **TESTER**: Xem và test nội dung

### Permission Categories:

- **Content**: View, Create, Edit, Delete, Download, Restore
- **Projects**: Manage projects và modules
- **Sharing**: Share content với users khác
- **Users**: Quản lý users
- **RBAC**: Quản lý roles và permissions

## 📝 Content Types

1. **FILE_ZIP_HTML**: File ZIP chứa HTML, CSS, JS tĩnh
2. **FILE_ZIP_SCORM**: Package SCORM 1.2/2004 chuẩn

## 🔄 Workflow

1. **Upload**: Developer upload file ZIP
2. **Processing**: Server tự động extract và phân tích
3. **Host**: Nội dung được host tại `/uploads/content/...`
4. **Share**: Chia sẻ với users/testers với permissions tùy chỉnh
5. **Test**: Testers truy cập và test nội dung
6. **Manage**: CRUD operations qua dashboard

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Kiểm tra DATABASE_URL trong .env
# Đảm bảo MySQL service đang chạy
# Test connection: npx prisma db pull
```

### Prisma Generate Error

```bash
# Xóa node_modules và reinstall
rm -rf node_modules .next
pnpm install
npx prisma generate
```

### Build Error

```bash
# Clean build
rm -rf .next
npm run build
```

## 📄 License

Private Project
