create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text not null default 'USER' check (role in ('USER', 'ADMIN')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.profiles
        where id = user_id
          and role = 'ADMIN'
          and is_active = true
    );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    resolved_name text;
begin
    resolved_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

    insert into public.profiles (id, full_name)
    values (new.id, coalesce(resolved_name, split_part(new.email, '@', 1), 'HomeBranch User'))
    on conflict (id) do nothing;

    return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

create policy "profiles_select_own"
    on public.profiles for select
    to authenticated
    using (id = auth.uid());

create policy "profiles_update_own_name"
    on public.profiles for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()) and is_active = (select is_active from public.profiles where id = auth.uid()));

create policy "profiles_admin_select"
    on public.profiles for select
    to authenticated
    using (public.is_admin(auth.uid()));

create policy "profiles_admin_update"
    on public.profiles for update
    to authenticated
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));
