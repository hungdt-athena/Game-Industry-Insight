# Development Workflow

Quy trình thêm mới một tính năng (Feature Workflow) cho Insight Library.

## Bước 1: Phân tích & Design
1. Xác định yêu cầu (User Story).
2. Kiểm tra UI Design (nếu có).
3. Xác định Data Schema cần thiết (Table nào, quan hệ gì).

## Bước 2: Backend/Database (Nếu cần)
1. Cập nhật Supabase schema.
2. Cập nhật `types.ts` trong frontend (hoặc shared folder) để phản ánh schema mới.
3. Viết query function trong `queries.ts`.

## Bước 3: Frontend Implementation
1. **Tạo Component UI (Static)**:
   - Xây dựng component với hard-coded data trước.
   - Đảm bảo responsive và styling đúng design.
2. **Tích hợp Data**:
   - Thay thế hard-coded data bằng React Query hook.
   - Xử lý Loading/Error states.
3. **Refactor**:
   - Tách nhỏ component nếu quá lớn.
   - Review code theo `CODING_STANDARDS.md`.

## Bước 4: Verification
1. Chạy TS Check: `npm run build` (hoặc `tsc --noEmit`).
2. Test trên Mobile view (Chrome DevTools).
3. Commit code.

---

## Mẹo làm việc hiệu quả với AI Assistant

Khi yêu cầu AI code, hãy cung cấp ngữ cảnh theo format:
1. **Mục tiêu**: "Tạo tính năng X..."
2. **Context**: "Dựa trên file `types.ts` hiện tại..."
3. **Constraints**: "Dùng Tailwind, không dùng thư viện mới..."
4. **Tham chiếu Docs**: "Tuân thủ `CODING_STANDARDS.md`..."
