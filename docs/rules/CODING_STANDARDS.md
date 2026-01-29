# Coding Standards & Guidelines

Để đảm bảo tính nhất quán và chất lượng code cao cho **Insight Library**, vui lòng tuân thủ các quy tắc sau:

## 1. Naming Conventions (Quy tắc đặt tên)

- **Folders/Files**:
  - React Components: `PascalCase.tsx` (e.g., `InsightCard.tsx`)
  - Utilities/Hooks: `camelCase.ts` (e.g., `useFeedPosts.ts`, `supabase.ts`)
  - Styles: `kebab-case.css` (e.g., `tailwind.css`)

- **Variables/Functions**: `camelCase` (e.g., `fetchData`, `userId`)
- **Components**: `PascalCase` (e.g., `function GalleryPage() {}`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT = 3`)
- **Types/Interfaces**: `PascalCase` (e.g., `interface UserProfile`)

## 2. Component Structure (Cấu trúc Component)

Mỗi component nên theo thứ tự:
1. **Imports**: External lib -> Internal components -> Types -> Styles/Assets.
2. **Types**: Props interface (nếu ngắn).
3. **Component Definition**:
   - Destructuring props.
   - Hooks (State, Query, Effect).
   - Helper functions (bên trong component nếu cần closure).
   - **Render**: Return JSX.

**Quy tắc:**
- Giữ component nhỏ (< 200 dòng). Nếu dài, tách nhỏ ra file riêng.
- Logic phức tạp nên đưa vào Custom Hooks (`/lib/hooks` hoặc `/hooks`).

## 3. TypeScript & Data Fetching

- **No `any`**: Luôn define type rõ ràng. Dùng `unknown` nếu chưa chắc chắn và type guard sau đó.
- **Zod Validation**: Dùng Zod để parse data từ API/Supabase để đảm bảo runtime type safety.
- **React Query**:
  - Encapsulate queries vào custom hooks (e.g., `useFeedPosts` thay vì gọi `useQuery` trực tiếp trong component).
  - Add `staleTime` hợp lý để tránh fetch thừa.

## 4. Styling (Tailwind CSS)

- Ưu tiên dùng Utility classes trực tiếp.
- Với style phức tạp hoặc lặp lại:
  - Dùng `@layer components` trong `tailwind.css` (đã config).
  - Hoặc tách component riêng (e.g., `Button`).
- Tránh hard-code màu sắc (`#f97316`), hãy dùng Design Tokens (`bg-primary-500`).

## 5. Git Conventions

- **Commit Message**:
  - `feat`: Tính năng mới (e.g., `feat: add masonry grid layout`)
  - `fix`: Sửa lỗi (e.g., `fix: mobile sidebar z-index issue`)
  - `refactor`: Tối ưu code, không đổi logic (e.g., `refactor: move types to shared folder`)
  - `docs`: Sửa tài liệu
  - `chore`: Cấu hình, dependencies

## 6. Error Handling

- Với Supabase queries: Luôn check `error` trước khi return data.
- UI: Luôn có trạng thái `Loading` (Skeleton) và `Error` (Empty state hoặc Toast message).
