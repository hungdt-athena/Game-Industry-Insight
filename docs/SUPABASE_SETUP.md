# Supabase Configuration for Replit

## Required Environment Variables

Khi deploy trên Replit, bạn cần thêm các environment variables sau vào **Secrets** (Tools → Secrets):

### 1. VITE_SUPABASE_URL
```
https://your-project-id.supabase.co
```

**Cách lấy:**
1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Settings → API
4. Copy **Project URL**

---

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Cách lấy:**
1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Settings → API
4. Copy **anon public** key (dưới mục "Project API keys")

---

## Setup trên Replit

### Bước 1: Add Secrets
1. Mở Repl: `game-industry-insight`
2. Click **Tools** (sidebar bên trái)
3. Click **Secrets**
4. Thêm 2 secrets:
   - Key: `VITE_SUPABASE_URL` → Value: `<your-url>`
   - Key: `VITE_SUPABASE_ANON_KEY` → Value: `<your-key>`

### Bước 2: Verify
Secrets sẽ tự động được inject vào environment khi build và run.

---

## Lưu ý Important
- ⚠️ **KHÔNG BAO GIỜ** commit `.env` file lên GitHub
- ✅ Chỉ commit `frontend/.env.example` (template)
- ✅ Mỗi environment (local, Replit, Vercel) cần setup riêng

---

## Database Schema Required

Đảm bảo Supabase database có các tables sau:

### Tables:
- `posts` - Bài viết
- `authors` - Tác giả
- `tags` - Tags (categories, topics, entities)
- `post_tags` - Many-to-many relationship
- `post_images` - Ảnh của posts

### Row Level Security (RLS):
Enable RLS cho tất cả tables và allow public read access:

```sql
-- Enable public read for all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON posts FOR SELECT USING (true);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON authors FOR SELECT USING (true);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON tags FOR SELECT USING (true);

ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON post_tags FOR SELECT USING (true);

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON post_images FOR SELECT USING (true);
```

---

## Troubleshooting

### Error: "Invalid API key"
- Kiểm tra lại `VITE_SUPABASE_ANON_KEY` có đúng không
- Đảm bảo copy đúng key (không thiếu ký tự)

### Error: "Network request failed"
- Kiểm tra `VITE_SUPABASE_URL` có đúng format không
- Đảm bảo Supabase project đang active

### Không load được data
- Kiểm tra RLS policies
- Kiểm tra database có data chưa
- Xem Console logs trong DevTools
