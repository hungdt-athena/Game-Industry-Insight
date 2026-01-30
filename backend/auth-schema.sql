-- =====================================================
-- AUTHENTICATION & USER MANAGEMENT SCHEMA
-- Game Industry Insight
-- =====================================================
-- Run this in Supabase SQL Editor

-- 1. Users table (extends Supabase auth.users with app-specific data)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'moderator', 'user')),
  is_approved boolean default false,  -- Must be approved by admin/mod to login
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. User saved posts (bookmarks)
create table public.user_saved_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id text references public.posts(id) on delete cascade not null,
  saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)  
);

-- 3. User follows (follow authors for new post notifications)
create table public.user_follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  author_id uuid references public.authors(id) on delete cascade not null,
  followed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, author_id)
);

-- 4. Post likes (heart/like on posts)
create table public.post_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id text references public.posts(id) on delete cascade not null,
  liked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- 5. Notifications
create table public.user_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('new_post', 'system', 'like', 'other')),
  title text not null,
  message text,
  post_id text references public.posts(id) on delete set null,  -- Optional link to post
  author_id uuid references public.authors(id) on delete set null,  -- Optional link to author
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Add like_count to posts table for quick access
alter table public.posts add column if not exists like_count integer default 0;

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_users_email on public.users(email);
create index idx_users_role on public.users(role);
create index idx_users_is_approved on public.users(is_approved);
create index idx_user_saved_posts_user_id on public.user_saved_posts(user_id);
create index idx_user_saved_posts_post_id on public.user_saved_posts(post_id);
create index idx_user_follows_follower_id on public.user_follows(follower_id);
create index idx_user_follows_author_id on public.user_follows(author_id);
create index idx_post_likes_user_id on public.post_likes(user_id);
create index idx_post_likes_post_id on public.post_likes(post_id);
create index idx_user_notifications_user_id on public.user_notifications(user_id);
create index idx_user_notifications_is_read on public.user_notifications(is_read);
create index idx_posts_like_count on public.posts(like_count desc);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

alter table public.users enable row level security;
alter table public.user_saved_posts enable row level security;
alter table public.user_follows enable row level security;
alter table public.post_likes enable row level security;
alter table public.user_notifications enable row level security;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view all approved users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

create policy "Users can read own profile" 
  on public.users for select 
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.users for update 
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admin can view all users" 
  on public.users for select 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admin can update any user" 
  on public.users for update 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Moderator can view all users" 
  on public.users for select 
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Admin/Mod can approve users"
  on public.users for update
  using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  )
  with check (
    -- Moderators can only update is_approved, not role
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
    or
    (
      exists (
        select 1 from public.users 
        where id = auth.uid() and role = 'moderator'
      )
      -- Additional check would be needed at app level
    )
  );

-- Saved posts policies
create policy "Users can view own saved posts" 
  on public.user_saved_posts for select 
  using (auth.uid() = user_id);

create policy "Users can save posts" 
  on public.user_saved_posts for insert 
  with check (auth.uid() = user_id);

create policy "Users can unsave posts" 
  on public.user_saved_posts for delete 
  using (auth.uid() = user_id);

-- Follows policies
create policy "Users can view own follows" 
  on public.user_follows for select 
  using (auth.uid() = follower_id);

create policy "Users can follow authors" 
  on public.user_follows for insert 
  with check (auth.uid() = follower_id);

create policy "Users can unfollow authors" 
  on public.user_follows for delete 
  using (auth.uid() = follower_id);

-- Public can see if author is followed (for follow counts)
create policy "Public can view follow counts" 
  on public.user_follows for select 
  using (true);

-- Post likes policies
create policy "Public can view likes" 
  on public.post_likes for select 
  using (true);

create policy "Users can like posts" 
  on public.post_likes for insert 
  with check (auth.uid() = user_id);

create policy "Users can unlike posts" 
  on public.post_likes for delete 
  using (auth.uid() = user_id);

-- Notifications policies
create policy "Users can view own notifications" 
  on public.user_notifications for select 
  using (auth.uid() = user_id);

create policy "Users can mark own notifications as read" 
  on public.user_notifications for update 
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "System can create notifications" 
  on public.user_notifications for insert 
  with check (true);  -- Typically handled via service role

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to create user profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update like_count when post is liked/unliked
create or replace function public.update_post_like_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.posts 
    set like_count = like_count + 1 
    where id = new.post_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.posts 
    set like_count = like_count - 1 
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger for like count
create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_like_count();

-- Function to create notification when followed author posts
create or replace function public.notify_followers_on_new_post()
returns trigger as $$
begin
  insert into public.user_notifications (user_id, type, title, message, post_id, author_id)
  select 
    uf.follower_id,
    'new_post',
    'New post from ' || a.name,
    new.title,
    new.id,
    new.author_id
  from public.user_follows uf
  join public.authors a on a.id = new.author_id
  where uf.author_id = new.author_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new post notifications
create trigger on_new_post_notify_followers
  after insert on public.posts
  for each row 
  when (new.author_id is not null)
  execute procedure public.notify_followers_on_new_post();

-- =====================================================
-- SEED DATA: Admin User
-- =====================================================
-- Note: First create the user via Supabase Auth, then update their role

-- After creating user hungdt@athena.studio via Auth:
-- update public.users 
-- set role = 'admin', is_approved = true 
-- where email = 'hungdt@athena.studio';
