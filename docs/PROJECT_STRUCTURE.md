# Project Structure

Dự án **Insight Library** được tổ chức theo cấu trúc Monorepo để dễ dàng quản lý, mở rộng và bảo trì.

## Cấu trúc thư mục cấp cao

```
Game-Industry-Insight/
├── frontend/           # React + Vite Application
├── backend/            # Express/Node.js Backend (Future)
├── shared/             # Shared Types, Utils, Constants
├── docs/               # Documentation & Rules
└── package.json        # Root script (Optional)
```

## Chi tiết các module

### 1. Frontend (`/frontend`)
Đây là nơi chứa toàn bộ code UI của ứng dụng.
- **Tech stack**: React, TypeScript, Vite, Tailwind CSS, Radix UI.
- **Structure**:
  ```
  src/
  ├── components/       # Reusable UI components
  ├── lib/             # Core utilities (Supabase, API, Types)
  ├── routes/          # Page components (Screens)
  ├── styles/          # Global styles (Tailwind)
  └── App.tsx          # Main entry & Routing
  ```

### 2. Backend (`/backend`) - *Coming Soon*
Nơi chứa API server.
- **Tech stack**: Node.js, Express (dự kiến).
- **Structure**: Sẽ bao gồm `controllers`, `services`, `routes`, `models`.

### 3. Shared (`/shared`) - *Optional*
Chứa code dùng chung giữa FE và BE.
- **Mục đích**: Đồng bộ TypeScript types, validation schemas (Zod), constants.
- **Lợi ích**: Khi sửa DB schema, chỉ cần sửa type ở đây, cả FE và BE đều báo lỗi nếu không khớp.

### 4. Docs (`/docs`)
Tài liệu hướng dẫn phát triển.
- `rules/`: Quy tắc coding, workflow, git conventions.
