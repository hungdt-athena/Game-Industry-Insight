-- 1. Create Authors table
create table public.authors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Tags table (Categories, Topics, Entities)
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('CATEGORY', 'TOPIC', 'ENTITY')),
  slug text, -- optional, for nice urls
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  summary text,
  key_takeaway text,
  sentiment text check (sentiment in ('Positive', 'Neutral', 'Negative')),
  published_date timestamp with time zone default timezone('utc'::text, now()),
  author_id uuid references public.authors(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Junction table for Posts <-> Tags
create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- 5. Create Post Images table
create table public.post_images (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Enable Row Level Security (RLS)
alter table public.authors enable row level security;
alter table public.tags enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_images enable row level security;

-- 7. Create Public Read Policies (Allow everyone to read data)
create policy "Public Read Authors" on public.authors for select using (true);
create policy "Public Read Tags" on public.tags for select using (true);
create policy "Public Read Posts" on public.posts for select using (true);
create policy "Public Read Post Tags" on public.post_tags for select using (true);
create policy "Public Read Post Images" on public.post_images for select using (true);

-- 8. (Optional) Insert some Seed Data - Categories
insert into public.tags (name, type) values
('Monetization', 'CATEGORY'),
('Game Design', 'CATEGORY'),
('Marketing', 'CATEGORY'),
('Market Trends', 'CATEGORY'),
('Production', 'CATEGORY');
