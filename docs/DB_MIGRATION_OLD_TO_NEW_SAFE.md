# Hướng dẫn migrate Database cũ → mới (không mất dữ liệu)

Tài liệu này hướng dẫn nâng cấp schema database theo các thay đổi mới trong project, đảm bảo **không xóa dữ liệu cũ**.

## 1) Các thay đổi schema chính

Dựa trên migration hiện có:

### `20260425_add_content_versioning.sql`
- Thêm cột `ContentData.launchFile` (nullable).
- Tạo bảng mới `ContentVersion`.
- Thêm index + unique `(contentId, version)`.
- Thêm FK:
  - `ContentVersion.contentId -> ContentData.id` (`ON DELETE CASCADE`)
  - `ContentVersion.createdById -> User.id` (`ON DELETE SET NULL`)

### `20260425_add_module_sharing.sql`
- Tạo bảng mới `ModuleShare`.
- Thêm index + unique `(moduleId, sharedWithId)`.
- Thêm FK tới `Module`, `Project`, `User`.

✅ Đây đều là thay đổi **additive** (thêm cột/bảng/index/FK), không có lệnh `DROP COLUMN`, `DROP TABLE`, hay đổi kiểu dữ liệu phá vỡ dữ liệu hiện hữu.

---

## 2) Nguyên tắc an toàn trước khi migrate

1. **Luôn backup full DB trước khi chạy migration**.
2. Chạy migration bằng `prisma migrate deploy` (không dùng `db push` trên production).
3. Dừng ghi dữ liệu tạm thời (maintenance mode) nếu hệ thống có nhiều traffic.
4. Kiểm tra dữ liệu tham chiếu trước khi thêm FK (nếu DB cũ có dữ liệu lệch chuẩn).

---

## 3) Checklist migrate an toàn

## Bước 0: Chuẩn bị
- Đảm bảo biến môi trường `DATABASE_URL` trỏ đúng DB cần migrate.
- Đảm bảo source code chứa đầy đủ file migration trong `prisma/migrations/`.

## Bước 1: Backup database

### Cách nhanh (MySQL)
```bash
mysqldump -u <user> -p --single-transaction --routines --triggers <database_name> > backup_before_migrate.sql
```

> Giữ file backup ở nơi an toàn. Đây là điểm rollback quan trọng nhất.

## Bước 2: Kiểm tra dữ liệu có thể gây lỗi FK

Do migration mới có thêm FK, nên kiểm tra trước các bản ghi mồ côi (orphan rows) nếu DB từng chỉnh tay.

```sql
-- ContentData.moduleId phải tồn tại trong Module
SELECT cd.id
FROM ContentData cd
LEFT JOIN Module m ON m.id = cd.moduleId
WHERE m.id IS NULL;

-- ContentData.projectId phải tồn tại trong Project
SELECT cd.id
FROM ContentData cd
LEFT JOIN Project p ON p.id = cd.projectId
WHERE p.id IS NULL;
```

Nếu có kết quả, cần xử lý dữ liệu sai trước khi migrate.

## Bước 3: Chạy migration

```bash
npx prisma migrate deploy
```

Lệnh này sẽ áp dụng các migration chưa chạy trong môi trường hiện tại.

## Bước 4: Regenerate Prisma client

```bash
npx prisma generate
```

## Bước 5: Verify sau migrate

```sql
-- Kiểm tra cột mới
SHOW COLUMNS FROM ContentData LIKE 'launchFile';

-- Kiểm tra bảng mới
SHOW TABLES LIKE 'ContentVersion';
SHOW TABLES LIKE 'ModuleShare';

-- Kiểm tra số lượng dữ liệu cũ còn nguyên
SELECT COUNT(*) FROM ContentData;
SELECT COUNT(*) FROM Project;
SELECT COUNT(*) FROM Module;
SELECT COUNT(*) FROM User;
```

---

## 4) Backfill dữ liệu phiên bản (khuyến nghị)

Schema mới có `ContentVersion`, nhưng dữ liệu cũ có thể chưa có lịch sử version. Để đồng nhất nghiệp vụ, có thể backfill mỗi `ContentData` thành version `1`.

```sql
INSERT INTO ContentVersion (
  version,
  contentUrl,
  launchFile,
  fileSize,
  status,
  contentId,
  createdById,
  createdAt
)
SELECT
  1 AS version,
  cd.contentUrl,
  cd.launchFile,
  cd.fileSize,
  cd.status,
  cd.id,
  cd.ownerId,
  NOW(3)
FROM ContentData cd
LEFT JOIN ContentVersion cv ON cv.contentId = cd.id
WHERE cv.id IS NULL;
```

> Câu lệnh trên chỉ insert cho content chưa có version, nên có thể chạy an toàn một lần sau migrate.

---

## 5) Kịch bản rollback

Nếu migration thất bại và cần quay lại nhanh:

1. Dừng app.
2. Restore từ backup:
```bash
mysql -u <user> -p <database_name> < backup_before_migrate.sql
```
3. Khởi động lại app với version code cũ.

---

## 6) Lưu ý môi trường Production

- Chạy thử đầy đủ quy trình trên staging trước.
- Đặt maintenance window ngắn để tránh phát sinh ghi dữ liệu giữa backup và migrate.
- Theo dõi log app sau khi deploy để bắt lỗi liên quan versioning/sharing.

---

## 7) Tóm tắt nhanh

- Migration hiện tại là **thêm mới**, an toàn cho dữ liệu cũ.
- Rủi ro chính nằm ở **dữ liệu lệch FK** và **quên backup**.
- Quy trình chuẩn: **Backup → Validate dữ liệu → Migrate deploy → Verify → (Optional) Backfill version**.
