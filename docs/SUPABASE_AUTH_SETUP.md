# HomeBranch Supabase Auth setup

## Supabase
1. Create a Supabase project.
2. Run `supabase/migrations/20260712111500_create_profiles.sql` in the SQL editor or with the Supabase CLI.
3. Authentication URL Configuration:
   - Site URL: `https://nmq-pi.vercel.app`
   - Redirect URLs:
     - `https://nmq-pi.vercel.app/email-verified`
     - `https://nmq-pi.vercel.app/reset-password`
     - `http://localhost:5173/email-verified`
     - `http://localhost:5173/reset-password`
4. Choose whether Confirm Email is enabled. If enabled, users must open the verification email before signing in.
5. Create the first account from `/sign-up`.
6. Promote the first admin manually after signup. Use one of these SQL statements and replace the identifier:

```sql
update public.profiles
set role = 'ADMIN'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

```sql
update public.profiles
set role = 'ADMIN'
where id = '00000000-0000-0000-0000-000000000000';
```

## Vercel
Add these Environment Variables, then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not add `service_role` keys to Vercel frontend variables or to this repository.
