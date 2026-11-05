# SDN302 Final Exam Quick Start & Strategy Guide
**Student ID:** `QE190122`

Dự án đã được thiết lập hoàn chỉnh 100% sẵn sàng để ôn tập và tái sử dụng cho bài thi chính thức.

---

## 1. Những phần ĐÃ LÀM XONG & DÙNG LẠI 100% KHÔNG CẦN VIẾT LẠI

1. **Hệ thống Next.js 14 App Router + TypeScript + Tailwind CSS + ShadCN UI**:
   - Cấu hình `components.json`, `tailwind.config.ts`, `globals.css`.
   - Các UI Component sẵn có: `Button`, `Card`, `Input`, `Badge`.
2. **Module Xác thực (Authentication) theo chuẩn FPT**:
   - Database model `User` (`id`, `email`, `passwordHash`, `createdAt`).
   - Mật khẩu mã hóa bằng `bcryptjs`.
   - JWT session lưu trong **HttpOnly cookie** tên `session_token` qua thư viện `jose`.
   - Các API route:
     - `POST /api/auth/register` (validate email, password >= 6, confirm match, chống trùng email).
     - `POST /api/auth/login` (kiểm tra password, set cookie `session_token`, trả về 200 `{ id, email }`).
     - `POST /api/auth/logout` (xóa cookie, trả về 200).
     - `GET /api/auth/me` (trả về 200 `{ id, email }` hoặc 401 Unauthorized).
   - Trang `/login` và `/register` đã có đầy đủ validation client (`noValidate`), hiển thị lỗi chính xác và đầy đủ các `data-testid` (`login-form`, `register-form`, `error-email`, `error-password`, `error-confirm-password`, `error-auth`, `form-success`, v.v.).
   - Header Navbar động: Khi chưa login hiện `btn-login`, `btn-register`. Khi login hiện `user-email`, `btn-logout`, link sang trang chính.
3. **Mẫu chuẩn cho Entity chính (hiện tại là `ExpenseTrail`)**:
   - `prisma/schema.prisma` liên kết User - Entity (`onDelete: Cascade`).
   - Route `GET /api/...`: lọc theo category, starred, search query q, sort date desc / title asc.
   - Route `POST /api/...`: validation chặt chẽ, kiểm tra trùng lặp (duplicate check) trả về status `409`.
   - Route `GET /api/.../summary`: tổng hợp count, starredCount, totalAmount, breakdown theo category có tie-break.
   - Route `PATCH /api/.../[id]` và `DELETE /api/.../[id]`: kiểm tra quyền sở hữu (ownership), trả về 404 nếu không tìm thấy.
   - Trang `/<entities>`: Route guard chống flash unauthenticated, Form thêm mới, Danh sách, Bộ lọc thời gian thực, Bảng thống kê.
   - Chia sẻ trạng thái qua React Context (`ExpenseContext`).
4. **Kịch bản đóng gói nộp bài tự động**:
   - `scripts/package-submission.ps1`: Tự động nén thành `QE190122.zip` đạt chuẩn 100% (có `package.json` ở root, loại trừ sạch `node_modules`, `.next`, `.git`, `.env`).
   - `scripts/generate-submission-docx.ps1`: Tự động tạo file Word `QE190122.docx` theo đúng mẫu text của đề.

---

## 2. Quy trình khi nhận ĐỀ CHÍNH THỨC trong phòng thi

Khi bạn nhận đề chính thức, bạn chỉ cần gửi file đề bài hoặc yêu cầu cho AI (hoặc tự thực hiện theo các bước sau):

### Bước 1: Chuẩn bị Database Supabase (Làm trước hoặc ngay khi phát đề)
1. Tạo 1 Project mới trên [Supabase](https://supabase.com).
2. Vào **Project Settings** -> **Database**:
   - Copy chuỗi kết nối **Transaction Pooler (port 6543)** gán cho biến `DATABASE_URL` trong file `.env`.
   - Copy chuỗi kết nối **Direct Connection (port 5432)** gán cho biến `DIRECT_URL` trong file `.env`.
3. Đặt `AUTH_SECRET="chuoi_bi_mat_ngau_nhien_bat_ky"`.
4. Tạo file `.env` tại thư mục gốc (không commit lên git):
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   AUTH_SECRET="fpt_sdn302_exam_secret_key_2026"
   ```

### Bước 2: Cập nhật Prisma Schema (`prisma/schema.prisma`)
- Giữ nguyên model `User`.
- Đổi tên model `Expense` thành tên thực thể mới (ví dụ: `Task`, `Booking`, `Course`, `Book`, v.v.).
- Đổi tên các trường (field) và kiểu dữ liệu theo bảng trong mục **2.2 Data** của đề thi.
- Chạy lệnh đẩy schema lên Supabase:
  ```bash
  npx prisma db push
  # hoặc npx prisma migrate dev --name init
  ```

### Bước 3: Đổi tên / Cập nhật API Routes
1. Sửa danh mục cho phép trong `src/lib/constants.ts` (nếu đề mới có các Category / Status khác).
2. Sửa các file trong `src/app/api/`:
   - Đổi tên thư mục `src/app/api/expenses/` thành `src/app/api/<tên_mới>/`.
   - Cập nhật các trường validate ở hàm `POST` và `PATCH`.
   - Cập nhật logic duplicate check (`409`) theo điều kiện đề mới yêu cầu.
   - Cập nhật hàm summary (`GET /api/<tên_mới>/summary`) theo công thức đề mới.

### Bước 4: Đổi tên / Cập nhật Giao diện Trang chính
1. Đổi tên thư mục `src/app/expenses/` thành `src/app/<tên_mới>/`.
2. Trong `src/components/Navbar.tsx`: sửa link và text sang trang mới.
3. Trong `src/app/<tên_mới>/page.tsx`:
   - Cập nhật các input trong Form ứng với các trường mới của đề.
   - Kiểm tra bảng **Required Test Hooks (`data-testid`)** trong mục 3 của đề để đảm bảo các `data-testid` trùng khớp 100% từng chữ hoa/thường.

### Bước 5: Build kiểm tra & Nộp bài
1. Chạy lệnh build để đảm bảo 0 lỗi TypeScript:
   ```bash
   npm run build
   ```
2. Đăng ký 1 tài khoản test cho giám khảo trên app web (hoặc qua API) như yêu cầu đề bài:
   - Email: `grader.qe190122@example.com`
   - Password: `Test1234!`
3. Đẩy code lên GitHub và kết nối Deploy lên Vercel (nhớ cấu hình 3 biến môi trường `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` trên Vercel).
4. Chạy script tạo 2 file nộp bài:
   ```powershell
   # Tạo file nén zip sạch
   powershell -ExecutionPolicy Bypass -File scripts/package-submission.ps1

   # Tạo file Word docx điền thông tin Vercel & Github
   powershell -ExecutionPolicy Bypass -File scripts/generate-submission-docx.ps1 -StudentCode "QE190122" -FullName "Họ Tên Bạn" -GithubUrl "https://github.com/..." -VercelUrl "https://..."
   ```
5. Nộp thư mục chứa `QE190122.zip` và `QE190122.docx`.

---

## 3. Lệnh kiểm tra nhanh các chức năng (Self-Check)
- Kiểm tra TypeScript & Next build: `npm run build`
- Chạy môi trường Dev: `npm run dev`
- Mở Prisma Studio để xem dữ liệu Supabase: `npx prisma studio`

