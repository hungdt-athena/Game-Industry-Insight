# 🧪 Testing Optimized Queries

## ✅ Setup Complete!

GalleryPage đã được switch sang optimized version.

---

## 📊 How to Test

### Step 1: Open Browser DevTools

1. Mở App: http://localhost:5173
2. Mở DevTools (F12 hoặc Cmd+Option+I)
3. Click tab **Network**
4. Filter: `supabase` (để chỉ xem Supabase requests)

---

### Step 2: Test OLD vs NEW

#### **OLD Version (Nếu muốn so sánh):**
```typescript
// frontend/src/routes/GalleryPage.tsx - Line 4
import { useFeedPosts } from '@/lib/queries'; // OLD VERSION
```

**Refresh page → Đếm requests:**
- Sẽ thấy ~60+ requests đến Supabase
- Mỗi post query riêng `post_images` và `post_tags`

---

#### **NEW Version (Đang active):**
```typescript
// frontend/src/routes/GalleryPage.tsx - Line 5
import { useFeedPostsOptimized as useFeedPosts } from '@/lib/hooks'; // NEW VERSION
```

**Refresh page → Đếm requests:**
- ✅ Chỉ còn 1-2 requests!
- 1 request lấy tất cả data với JOIN

---

## ⏱️ Performance Check

### Trước (OLD):
```
Network tab:
├── GET /rest/v1/posts → 30 rows
├── GET /rest/v1/post_images?post_id=xxx (x30)
└── GET /rest/v1/post_tags?post_id=xxx (x30)

Total: ~61 requests
Load time: 2-3s
```

### Sau (NEW):
```
Network tab:
└── GET /rest/v1/posts?select=*,post_images(*),post_tags(*)

Total: 1 request
Load time: 0.5-1s
```

---

## 🎯 Verify Results

### Check Points:
- [ ] App vẫn hiển thị cards bình thường?
- [ ] Có category tags (màu sắc)?
- [ ] Hover vào cards → có key_takeaway và tags?
- [ ] Filter by category hoạt động?
- [ ] View toggle (Grid/List) hoạt động?

### Expected:
- ✅ Mọi thứ giống hệt như trước
- ✅ NHƯNG load nhanh hơn rõ rệt
- ✅ Network requests giảm 98%

---

## 🐛 Nếu Có Lỗi

### Rollback Command:
```typescript
// frontend/src/routes/GalleryPage.tsx
import { useFeedPosts } from '@/lib/queries'; // Quay lại bản cũ
```

### Common Issues:

**1. Lỗi "slug does not exist"**
→ Fixed! Đã add `slug` vào TagSchema

**2. Posts không hiển thị**
→ Check Console logs
→ Có thể do dữ liệu không đầy đủ trong DB

**3. Filter không hoạt động**
→ Check `categoryId` có được pass vào hook không

---

## 📈 Next Steps

Nếu test OK:

### Apply to Other Pages:
1. **CategoryPage.tsx** - Tương tự GalleryPage
2. **TagPage.tsx** - Tương tự GalleryPage  
3. **PostDetailPage.tsx** - Cần optimize `getRandomPosts` riêng

### Optimize More:
- `getRelatedPostsByCategory()` - Dùng JOIN
- `getRandomPosts()` - Dùng JOIN

---

## ✨ Success Metrics

**If you see this:**
- Network tab: 1 request thay vì 60+
- Load time: < 1 second
- App hoạt động bình thường

**→ OPTIMIZATION THÀNH CÔNG!** 🎉

Push lên GitHub và deploy!
