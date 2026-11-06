# NoteKu — Personal Study Notes

NoteKu adalah SPA React/Vite untuk mengelola catatan belajar. Supabase Auth menangani sesi, Axios berkomunikasi langsung dengan Supabase PostgREST, dan RLS membatasi catatan ke pemiliknya. Catatan dan antrean perubahan juga disimpan di localStorage per akun agar CRUD tetap bisa dipakai offline.

Repository: https://github.com/fardanufibri25/Noteku-v2.0---Responsi-Mod-5-PPPB

## Fitur dan struktur

- **Beranda** — ringkasan total catatan dan kategori, catatan terbaru, dan aksi membuat catatan.
- **Catatan** — CRUD, pencarian, filter kategori, impor catatan lama, dan status sinkronisasi.
- **Profil** — informasi mahasiswa, status aplikasi, dan ekspor cadangan JSON.
- `src/pages/` halaman, `src/components/` UI, `src/hooks/` state React, `src/config/api.js` konfigurasi Axios, `src/services/noteService.js` REST CRUD, `src/services/offlineNotes.js` cache/outbox, `supabase/schema.sql` tabel dan RLS.

Stack: React, Vite, JavaScript, React Hooks, React Router, Axios, Supabase PostgreSQL/Auth, localStorage, `vite-plugin-pwa`, dan Lucide React.

## Persiapan Supabase

1. Buat proyek di [Supabase](https://supabase.com/).
2. Dari **Project Settings → API**, salin Project URL dan publishable key. Jangan gunakan service-role key di aplikasi.
3. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu jalankan. Skrip membuat `public.notes`, grants, dan kebijakan RLS per pemilik. Jika tabel lama memakai kolom `course`, nilainya disalin ke `category` dan kolom lama dibuat nullable agar data lama tetap tersimpan.
4. Aktifkan provider Email di **Authentication → Providers**. Atur Site URL/redirect ke origin lokal dan domain Vercel yang dipakai.
5. Salin `.env.example` ke `.env.local` dan isi:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Opsional; jika dikosongkan memakai VITE_SUPABASE_URL.
VITE_API_BASE_URL=https://YOUR_PROJECT.supabase.co
```

`VITE_API_BASE_URL` adalah URL dasar proyek Supabase, tanpa `/rest/v1`. Axios menambahkan path `/rest/v1/notes`, `apikey`, dan access token sesi sebagai `Authorization: Bearer`. Publishable key memang dikirim ke browser; perlindungan data dilakukan oleh autentikasi dan RLS. Jangan menaruh service-role key di `.env` frontend.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka URL Vite yang ditampilkan (umumnya `http://localhost:5173`). Buat akun atau masuk; bila konfirmasi email aktif, verifikasi email dahulu. CRUD online memerlukan tabel dan variabel Supabase yang telah dikonfigurasi.

Pemeriksaan lokal:

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm run preview` menyajikan build frontend untuk pemeriksaan lokal, bukan server Supabase. Request database dikirim langsung ke proyek Supabase.

## Offline dan pengujian PWA

`vite-plugin-pwa` menghasilkan manifest dan service worker dengan cache app-shell. Buka aplikasi online untuk pertama kali dan masuk, lalu gunakan DevTools → Application untuk memeriksa manifest/service worker dan jalankan **Install app**. Setelah shell pernah tersimpan, putuskan jaringan untuk menguji buka aplikasi, navigasi, baca cache, serta tambah/edit/hapus lokal. Perubahan masuk antrean per akun dan dikirim berurutan ke Supabase saat online kembali. Periksa indikator pending/sync dan row pada Table Editor setelah sinkronisasi. Login/registrasi memerlukan koneksi; konflik versi lintas perangkat mempertahankan antrean dan menampilkan pesan, bukan menimpa data diam-diam.

Cache catatan dipisahkan berdasarkan user ID. Jangan menganggap perubahan offline sudah ada di database atau perangkat lain sebelum status tersinkron.

## Deploy ke Vercel

Project Vercel **`noteku-ppb`** sudah dibuat dan dideploy ke **https://noteku-ppb.vercel.app**. Project lama `noteku` tidak diubah. Deployment memerlukan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (key publishable/browser-safe) di environment Production; kode juga menerima nama `VITE_SUPABASE_PUBLISHABLE_KEY`. Jangan gunakan service-role key.

Untuk deployment berikutnya:

1. Pastikan perubahan ada di source lokal atau repository yang terhubung, lalu jalankan `npm run build`.
2. Deploy dari direktori project dengan `vercel --prod` atau push ke repository Git yang terhubung.
3. Pastikan environment variables Supabase tersedia untuk Production dan redeploy jika diubah.
4. Tambahkan `https://noteku-ppb.vercel.app` ke **Supabase → Authentication → URL Configuration**. Uji login, CRUD, reload, PWA install, offline, dan sinkronisasi.
5. Link production untuk dikumpulkan: **https://noteku-ppb.vercel.app**.

Catatan: migrasi `supabase/schema.sql` telah diterapkan pada project Supabase yang dipakai deployment ini, termasuk kolom `category`. Jika memakai project Supabase lain, jalankan skrip tersebut sebelum mencoba CRUD; build/deployment tidak menerapkan migrasi database secara otomatis.
