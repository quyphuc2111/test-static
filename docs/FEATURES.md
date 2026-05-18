# Static Content Server — Mô tả Tính năng

> Hệ thống quản lý nội dung tĩnh (HTML/SCORM) dựa trên Next.js, Prisma (MySQL), với hệ thống phân quyền RBAC đầy đủ.

---

## 1. Xác thực & Phiên làm việc (Authentication)

- Đăng nhập bằng **username** hoặc **email** + mật khẩu (bcrypt hash)
- Quản lý phiên (session) phía server với `iron-session`
- Hỗ trợ CSRF token để bảo vệ các request POST/PUT/DELETE
- Tự động kiểm tra trạng thái tài khoản (ACTIVE / DISABLED)
- Ghi audit log khi đăng nhập
- API:
  - `POST /api/auth/login` — Đăng nhập
  - `GET /api/auth/me` — Lấy thông tin user hiện tại + CSRF token

---

## 2. Quản lý Dự án (Project Management)

- Tạo, sửa, xem danh sách dự án
- Mỗi dự án có: tên (unique), mô tả, trạng thái (`ACTIVE` / `INACTIVE` / `ARCHIVED`)
- Hỗ trợ **xóa mềm** (soft delete) và **xóa vĩnh viễn** (hard delete)
- Khôi phục dự án đã xóa mềm
- Tạo dự án kèm danh sách module ban đầu
- Giao diện dạng **card grid** responsive (1→2→3 cột)
- Tìm kiếm dự án theo tên/mô tả với debounce
- Tab chuyển đổi giữa dự án đang hoạt động và đã xóa
- Ghi audit log cho mọi thao tác
- API:
  - `GET /api/projects` — Danh sách (hỗ trợ `includeDeleted`, `onlyDeleted`)
  - `POST /api/projects` — Tạo mới
  - `PUT /api/projects/[id]` — Cập nhật
  - `POST /api/projects/[id]/soft-delete` — Xóa mềm
  - `DELETE /api/projects/[id]/hard-delete` — Xóa vĩnh viễn
  - `POST /api/projects/[id]/restore` — Khôi phục

---

## 3. Quản lý Module

- Mỗi dự án chứa nhiều module
- Module có: tên (unique trong dự án), mô tả, trạng thái (`ACTIVE` / `INACTIVE`)
- CRUD đầy đủ: tạo, sửa, xóa module
- Hỗ trợ xóa mềm, xóa vĩnh viễn, khôi phục module
- Hiển thị số lượng nội dung trong mỗi module
- Quản lý module qua dialog trong giao diện dự án
- API:
  - `GET /api/projects/[id]/modules` — Danh sách module
  - `POST /api/projects/[id]/modules` — Tạo module
  - `PUT /api/projects/[id]/modules/[moduleId]` — Cập nhật
  - `POST /api/projects/[id]/modules/[moduleId]/soft-delete` — Xóa mềm
  - `DELETE /api/projects/[id]/modules/[moduleId]/hard-delete` — Xóa vĩnh viễn
  - `POST /api/projects/[id]/modules/[moduleId]/restore` — Khôi phục

---

## 4. Quản lý Nội dung (Content Management)

- Upload file ZIP chứa nội dung HTML hoặc SCORM
- Hệ thống tự động giải nén ZIP và tìm file `index.html`
- Hỗ trợ 2 loại nội dung:
  - **FILE_ZIP_HTML** — Gói HTML tĩnh
  - **FILE_ZIP_SCORM** — Gói SCORM (1.2 / 2004)
- Trạng thái xử lý: `PROCESSING` → `COMPLETED` / `FAILED` với progress (0-100%)
- Mỗi nội dung thuộc về 1 dự án + 1 module + 1 owner
- Hỗ trợ xóa mềm, xóa vĩnh viễn, khôi phục nội dung
- Xóa hàng loạt (bulk delete)
- Import nội dung
- Cập nhật file nội dung (thay thế ZIP)
- Download nội dung
- Kiểm tra trùng lặp tiêu đề trong cùng module/owner
- Ghi audit log cho mọi thao tác
- API:
  - `GET /api/projects/[id]/modules/[moduleId]/content` — Danh sách nội dung
  - `POST /api/projects/[id]/modules/[moduleId]/content` — Upload nội dung mới
  - `PUT /api/projects/[id]/modules/[moduleId]/content/[contentId]` — Cập nhật metadata
  - `POST /api/projects/[id]/modules/[moduleId]/content/[contentId]/upload` — Upload file
  - `POST /api/projects/[id]/modules/[moduleId]/content/[contentId]/update-file` — Thay thế file
  - `GET /api/projects/[id]/modules/[moduleId]/content/[contentId]/download` — Tải xuống
  - `POST /api/projects/[id]/modules/[moduleId]/content/[contentId]/restore` — Khôi phục
  - `DELETE /api/projects/[id]/modules/[moduleId]/content/[contentId]/hard-delete` — Xóa vĩnh viễn
  - `POST /api/projects/[id]/modules/[moduleId]/content/bulk-delete` — Xóa hàng loạt
  - `POST /api/projects/[id]/modules/[moduleId]/content/import` — Import nội dung

---

## 5. SCORM Player

- Trình phát SCORM tích hợp tại `/scorm/view?entry=<path>`
- Hỗ trợ SCORM 1.2 và SCORM 2004
- Tự động phát hiện phiên bản SCORM từ `imsmanifest.xml`
- Validate gói SCORM (kiểm tra manifest, resources, organizations)
- Tìm launch file tự động từ manifest
- SCORM API wrapper (`SCORM_API_wrapper.js`) cho tương tác runtime

---

## 6. Chia sẻ Nội dung (Content Sharing)

- Chia sẻ nội dung giữa các user với quyền chi tiết:
  - `canView` — Xem
  - `canDownload` — Tải xuống
  - `canEdit` — Chỉnh sửa
  - `canDelete` — Xóa
- Chia sẻ đơn lẻ (1 nội dung → 1 user)
- Chia sẻ hàng loạt (bulk share) theo:
  - Toàn bộ dự án (`PROJECT` scope)
  - Toàn bộ module (`MODULE` scope)
  - Toàn bộ nội dung của 1 owner (`OWNER` scope)
  - Danh sách nội dung cụ thể (`LIST` scope)
- Hệ thống batch tracking để theo dõi lịch sử chia sẻ
- Thu hồi quyền chia sẻ (revoke)
- Smart upsert: cập nhật quyền nếu đã chia sẻ trước đó
- Nội dung đã xóa mềm không hiển thị cho user được chia sẻ
- Ghi audit log cho mọi thao tác chia sẻ
- API:
  - `GET /api/content-sharing` — Danh sách chia sẻ
  - `POST /api/content-sharing` — Tạo/cập nhật chia sẻ
  - `DELETE /api/content-sharing` — Xóa chia sẻ
  - `POST /api/content-sharing/revoke` — Thu hồi chia sẻ

---

## 7. Quản lý Người dùng (User Management)

- Tạo, sửa, xem danh sách người dùng
- Mỗi user có: username (unique), email (unique), tên, mật khẩu hash
- Trạng thái tài khoản: `ACTIVE` / `DISABLED`
- Bật/tắt trạng thái tài khoản (toggle status)
- Reset mật khẩu
- Gán/gỡ vai trò (role) cho user
- Xem nội dung thuộc sở hữu của user
- API:
  - `GET /api/users` — Danh sách
  - `POST /api/users` — Tạo mới
  - `PUT /api/users/[userId]` — Cập nhật
  - `POST /api/users/[userId]/toggle-status` — Bật/tắt trạng thái
  - `POST /api/users/[userId]/reset-password` — Reset mật khẩu
  - `GET /api/users/[userId]/roles` — Danh sách vai trò
  - `PUT /api/users/[userId]/roles` — Cập nhật vai trò
  - `GET /api/users/[userId]/content` — Nội dung của user

---

## 8. Phân quyền RBAC (Role-Based Access Control)

### Vai trò (Roles)
- Vai trò mặc định: `ADMINISTRATOR`, `DEV`, `TESTER`
- Tạo, sửa, clone, bật/tắt vai trò
- Mỗi vai trò gắn với nhiều quyền (permissions)

### Quyền hạn (Permissions)
Hệ thống có **35+ quyền** chia theo nhóm:

| Nhóm | Quyền |
|------|-------|
| Nội dung (CRUD) | VIEW, CREATE, EDIT, DOWNLOAD, SOFT_DELETE, HARD_DELETE, VIEW_DELETED_ALL, VIEW_DELETED_OWN, RESTORE |
| Phạm vi nội dung | MANAGE_ALL, MANAGE_OWN, VIEW_OWN_ONLY |
| Chia sẻ nội dung | VIEW_SHARED, SHARE_ACCESS |
| Dự án | VIEW, CREATE, EDIT, SOFT_DELETE, HARD_DELETE, VIEW_DELETED, RESTORE |
| Module | VIEW, CREATE, EDIT, SOFT_DELETE, HARD_DELETE, VIEW_DELETED, RESTORE |
| Người dùng | VIEW, CREATE, EDIT, SOFT_DELETE, HARD_DELETE, MANAGE_PERMISSIONS |
| Audit & Dashboard | VIEW_AUDIT_LOGS, VIEW_DASHBOARD_STATS |

### Cơ chế phân quyền
- Quyền gán qua vai trò (Role → Permission)
- Quyền gán trực tiếp cho user (User → Permission) với `allow` flag
- Component `PermissionGuard` kiểm tra quyền ở frontend
- Middleware kiểm tra quyền ở backend (API routes)
- API:
  - `GET /api/roles` — Danh sách vai trò
  - `POST /api/roles` — Tạo vai trò
  - `PUT /api/roles/[id]` — Cập nhật
  - `POST /api/roles/[id]/clone` — Clone vai trò
  - `POST /api/roles/[id]/toggle` — Bật/tắt
  - `GET /api/permissions` — Danh sách quyền

---

## 9. Dashboard & Thống kê

- Tổng quan hệ thống: số dự án, module, nội dung, người dùng
- Thống kê nội dung theo trạng thái
- Lịch sử hoạt động gần đây (activity feed)
- API:
  - `GET /api/dashboard/stats` — Thống kê tổng quan
  - `GET /api/dashboard/activity` — Hoạt động gần đây
  - `GET /api/content/stats` — Thống kê nội dung

---

## 10. Audit Log

- Ghi lại mọi thao tác quan trọng trong hệ thống
- Thông tin ghi: actor, action, entity type, entity ID, metadata, timestamp
- Các loại action: `login`, `created`, `updated`, `deleted`, `soft_deleted`, `hard_deleted`, `restored`, `bulk_shared`, `revoked`
- Entity types: `User`, `Project`, `Module`, `ContentData`, `ContentShare`

---

## 11. Kiến trúc Kỹ thuật

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack React Query (server state)
- **Database**: MySQL + Prisma ORM
- **Authentication**: iron-session (cookie-based)
- **Deployment**: Docker + Docker Compose

### Cấu trúc thư mục
```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (manager)/          # Layout group cho trang quản lý
│   ├── api/                # REST API endpoints
│   ├── login/              # Trang đăng nhập
│   └── scorm/view/         # SCORM player
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── project/            # Quản lý dự án
│   ├── content/            # Quản lý nội dung
│   ├── users/              # Quản lý người dùng
│   ├── rbac/               # Phân quyền
│   ├── content-sharing/    # Chia sẻ nội dung
│   ├── dashboard/          # Dashboard
│   ├── layout/             # Header, Footer
│   └── scorm-player/       # SCORM player component
├── modules/                # Business logic modules
│   ├── auth/               # Xác thực
│   ├── project/            # Dự án & Module
│   ├── content/            # Nội dung
│   ├── rbac/               # Phân quyền
│   └── dashboard/          # Dashboard
├── constants/              # Hằng số (API URLs, permissions, navigation)
├── hooks/                  # Shared hooks (pagination, etc.)
├── lib/                    # Utilities (prisma, session, auth, csrf, audit)
├── services/               # HTTP client, SCORM service, storage service
└── types/                  # Shared TypeScript types
```

### Tính năng bảo mật
- Mật khẩu hash bằng bcrypt
- CSRF protection cho mọi mutation request
- Session-based authentication (httpOnly cookies)
- Permission check ở cả frontend (PermissionGuard) và backend (API middleware)
- Sanitize tên file/thư mục (loại bỏ dấu tiếng Việt, ký tự đặc biệt)
- Kiểm tra ownership cho nội dung (chỉ owner hoặc admin mới quản lý được)
