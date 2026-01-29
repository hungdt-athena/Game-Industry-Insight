# Trending Topics & Top Sources - Giải thích cách hoạt động

## 1. Trending Topics (Tags)

### Hiện trạng
Hiện tại Trending Topics được fetch từ Supabase theo logic sau:

**File**: `frontend/src/lib/queries.ts` → Function `getTrendingTags()`

```typescript
export async function getTrendingTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .in('type', ['TOPIC', 'ENTITY'])
    .limit(20);

  return (data || []) as Tag[];
}
```

**Cách hoạt động:**
- Fetch 20 tags có `type` là `TOPIC` hoặc `ENTITY` từ bảng `tags`.
- **Không có logic ranking** (không sort theo số lượng post sử dụng tag).
- Chỉ là danh sách tags ngẫu nhiên từ database.

**Vấn đề:**
- Không phải thực sự là "trending" (không tính số lần xuất hiện).
- Nếu database có nhiều tags, chỉ lấy 20 đầu tiên (không có tiêu chí nào).

### Giải pháp để cải thiện
Để tags thực sự "trending", cần:
1. **Đếm số lượng posts sử dụng từng tag** (join với `post_tags`).
2. **Sort theo số lượng giảm dần**.
3. **Optional**: Lọc theo thời gian (chỉ đếm posts trong 30 ngày gần nhất).

**Query mới (đề xuất):**
```sql
SELECT 
  t.id, 
  t.name, 
  t.type,
  COUNT(pt.post_id) as usage_count
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
LEFT JOIN posts p ON pt.post_id = p.id
WHERE t.type IN ('TOPIC', 'ENTITY')
  AND p.created_at > NOW() - INTERVAL '30 days'  -- Optional: Recent only
GROUP BY t.id, t.name, t.type
ORDER BY usage_count DESC
LIMIT 20;
```

---

## 2. Top Sources

### Hiện trạng
Top Sources **hoàn toàn hard-coded** (giá trị cố định trong UI).

**File**: `frontend/src/components/Sidebar.tsx` (dòng 156-173)

```tsx
<div>
  <h3>Top Sources</h3>
  <div className="space-y-2">
    <div>
      <span>GDC Talks</span>
      <span>24</span>  {/* Hard-coded */}
    </div>
    <div>
      <span>Deconstructor of Fun</span>
      <span>18</span>  {/* Hard-coded */}
    </div>
    <div>
      <span>GameAnalytics Blog</span>
      <span>12</span>  {/* Hard-coded */}
    </div>
  </div>
</div>
```

**Vấn đề:**
- Không động (không update theo data thực tế).
- Cần manual update nếu muốn thay đổi.

### Giải pháp để cải thiện

**Cách 1: Thêm field `source` vào bảng `posts`**
- Add column `source` (text, nullable) vào table `posts`.
- Khi import post từ Google Drive, tự động fill `source` (e.g., "GDC Talks", "Blog X").
- Query để đếm:
```sql
SELECT source, COUNT(*) as count
FROM posts
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC
LIMIT 5;
```

**Cách 2: Dùng table riêng `sources`**
- Tạo bảng `sources` (id, name, url, logo_url).
- Thêm `source_id` vào `posts`.
- Query join để lấy top sources.

**Cách 3: Parse từ `author` hoặc tags**
- Nếu không muốn thêm column mới, có thể:
  - Dùng domain từ `post_images.image_url` (nếu image từ source nào).
  - Hoặc dùng tag type `SOURCE` (thêm enum mới).

---

## Tóm tắt
| Feature | Hiện trạng | Cải thiện |
|---------|-----------|-----------|
| **Trending Topics** | Random fetch 20 tags | Đếm usage + sort theo popularity |
| **Top Sources** | Hard-coded UI | Dynamic fetch từ DB (cần thêm field `source`) |

Để implement cải thiện:
1. Update Supabase schema (nếu cần thêm field `source`).
2. Sửa query trong `queries.ts`.
3. Update UI để hiển thị data động thay vì hard-code.
