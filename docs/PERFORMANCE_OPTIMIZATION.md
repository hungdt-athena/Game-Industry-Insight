# Performance Optimization Guide

## 🎯 Hiện trạng

**Vấn đề:** Query **N+1 pattern** - Mỗi post query riêng 2 lần:
- Query 1: Lấy danh sách posts (30 posts)
- Query 2-31: Mỗi post query `post_images` (30 queries)
- Query 32-61: Mỗi post query `post_tags` (30 queries)

**Tổng:** 61 queries để hiển thị 30 posts! ❌

---

## ✅ 3 Mức Tối Ưu

### **Level 1: Database Indexes (QUAN TRỌNG NHẤT)**

**Impact:** 🚀🚀🚀 50-80% faster queries

**Làm:**
1. Vào Supabase Dashboard → SQL Editor
2. Copy toàn bộ file `backend/indexes.sql`
3. Run → Indexes sẽ được tạo

**Lý do:**
- Indexes giúp database tìm data nhanh hơn (như mục lục sách)
- Đặc biệt quan trọng cho `post_id` và `tag_id` (hay query nhất)

---

### **Level 2: Fix N+1 Query (Code Change)**

**Impact:** 🚀🚀 60 queries → 1 query

**Trước:**
```typescript
// 61 queries cho 30 posts
for each post:
    query post_images WHERE post_id = ...
    query post_tags WHERE post_id = ...
```

**Sau:**
```typescript
// 1 query duy nhất với JOIN
SELECT posts.*, post_images.*, post_tags.*
FROM posts
JOIN post_images ON ...
JOIN post_tags ON ...
```

**Làm:**
- File `queries-optimized.ts` đã tạo sẵn
- Thay đổi import từ `getFeedPosts` → `getFeedPostsOptimized`

---

### **Level 3: React Query Cache Tuning**

**Impact:** 🚀 Giảm duplicate requests

**Config:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 📊 Kết Quả Dự Kiến

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Queries** | 61 | 1 | **98% ↓** |
| **Load time** | 3-5s | 0.5-1s | **80% ↓** |
| **Data transfer** | ~500KB | ~200KB | **60% ↓** |

---

## 🛠 Implement Steps

### Step 1: Add Indexes (Làm ngay!)
```bash
# Copy backend/indexes.sql vào Supabase SQL Editor và Run
```

### Step 2: Switch to Optimized Query (Optional - test trước)
```typescript
// src/lib/queries.ts
import { getFeedPostsOptimized } from './queries-optimized';

// Thay thế function cũ
export { getFeedPostsOptimized as getFeedPosts };
```

### Step 3: Tune Cache (Optional)
```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});
```

---

## ⚠️ Lưu Ý

- **Level 1** (Indexes): Không rủi ro, làm ngay! ✅
- **Level 2** (Code): Test kỹ trước khi deploy
- **Level 3** (Cache): Điều chỉnh dựa trên user behavior

---

## 🎓 Bonus: Future Optimizations

1. **Pagination với cursor-based** thay vì offset
2. **Virtual scrolling** cho lists dài
3. **Image CDN** (Supabase Storage đã có)
4. **Lazy load components** với React.lazy()
5. **Service Worker** cho offline support
