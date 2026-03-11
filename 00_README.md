# Knesset Lobby Management System (לוביסט פרו)

A professional lobbying management system for working with the Israeli Knesset and Government.

## Quick Setup

```bash
# Download and run the setup script (00_SETUP_SCRIPT.sh from this gist)
bash setup.sh

# Or manually:
cd knesset-lobby
npm install
npx prisma db push
npm run db:seed
npm run dev
```

## File Structure

Files in this gist use `__` as path separators. For example:
- `src__app__page.tsx` → `src/app/page.tsx`
- `prisma__schema.prisma` → `prisma/schema.prisma`

## Default Login
- Email: yoav@jlm-group.com
- Password: lobby123
