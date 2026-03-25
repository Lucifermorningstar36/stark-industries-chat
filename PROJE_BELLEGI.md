# STARK INDUSTRIES CHAT - PROJE BELLEĞİ VE DURUM ÖZETİ
*Son Güncelleme: 23 Mart 2026*

Bu dosya, J.A.R.V.I.S. ile şu ana kadar başardığımız her şeyin kalıcı kaydıdır. Bu dosyayı bana okutman yeterli — tüm sistem mimarisini ve kod geçmişini anında hatırlayacağım.

---

## 1. TAMAMLANAN TEMEL SİSTEMLER
- **Kimlik Doğrulama:** JWT tabanlı güvenli giriş ve kayıt (Bcrypt şifreleme).
- **Gerçek Zamanlı Sohbet:** Socket.io ile anlık mesajlaşma, mesaj geçmişi (PostgreSQL/Prisma).
- **Durum Bildirimleri:** Online/Offline kullanıcı listesi, yazıyor... göstergesi.
- **Giriş Animasyonu:** Siteye ilk girişte otomatik sessiz oynatılan `intro.mp4` J.A.R.V.I.S. animasyonu.
- **Docker Altyapısı:** `docker compose` ile frontend, backend ve veritabanı tek komutta ayağa kalkıyor.

---

## 2. MOBİL UYUM VE ARAYÜZ (UI/UX)
- **Alt Gezinme Çubuğu:** Mobilde altta Discord tarzı dock (Sohbetler, Ses, Ajanlar, Ayarlar).
- **Kaydırmalı Çekmece Menüler:** Mobilde sağ/sol menüler çakışmıyor.

---

## 3. WEBRTC SES VE GÖRÜNTÜ KANALI
`VoiceRoom.tsx` içinde tam P2P Mesh WebRTC ağı:
- Klon engelleyici (aynı hesap 2 sekmeden girince yankı yok)
- Konuşan kişi mavi neon ışıkla parlıyor (AudioContext analizi)
- Kişisel ses slider'ı, Sağırlaştırma (Deafen), Kamera çevirme (mobil)
- Bağımsız ses yakalayıcı (ekran paylaşımında sistem sesi kesilmiyor)

---

## 4. ODAKLI YAYIN (FOCUSED STREAM VIEW)
- Ekran paylaşımı açıldığında yayın büyük odak alanına geçiyor, diğer katılımcılar sağda ızgara.

---

## 5. DOSYA / DM / ÇOK KANALLI SES (21 Mart 2026)

### 5.1 Dosya / Resim / Ses Kaydı Gönderme
- Ataş ikonu: Resim, ses, PDF, DOC, ZIP gönderme (max 10MB)
- Mikrofon ikonu: Anlık ses kaydı (WebM)
- `FileMessage.tsx`: Resim önizleme, ses oynatıcı, dosya indirme
- Prisma `Message` modeline `fileUrl`, `fileType`, `fileName` eklendi
- DM'lerde de aynı özellikler mevcut

### 5.2 Özel DM Sistemi
- `DirectMessage.tsx`: Modal DM penceresi
- Kullanıcı listesinde hover'da mesaj ikonu, UserProfileModal'da DM butonu
- Socket.io: `send-dm`, `dm-typing`, `dm-stop-typing`
- Backend: `DirectMessage` Prisma modeli, `/api/chat/dm/:userId` route'ları

### 5.3 Birden Fazla Ses Kanalı
- Kanal geçişinde önceki kanaldan otomatik çıkış
- Aktif ses kanalında yeşil nokta animasyonu

---

## 6. ADMİN PANELİ (admin.stark.net.tr)

### 6.1 Stack ve Erişim
- React + Vite + TailwindCSS (ayrı `admin/` klasörü)
- `admin.stark.net.tr` adresinden Caddy reverse proxy ile erişim
- JWT auth — sadece `role: ADMIN` kullanıcılar girebilir
- `admin/src/api.ts` → axios instance, token header'ı otomatik ekliyor

### 6.2 Admin Panel Sayfaları
- **Dashboard** (`/`): Toplam kullanıcı/mesaj/kanal istatistikleri, 7 günlük mesaj grafiği, kanal bazlı mesaj dağılımı, son mesajlar
- **Users** (`/users`): Tüm kullanıcılar tablosu, kullanıcı silme
- **Channels** (`/channels`): Kanal listesi, yeni kanal oluşturma, kanal silme
- **Messages** (`/messages`): Sayfalı mesaj logu, arama, mesaj silme
- **Holographics** (`/3d`): 3D JARVIS arayüzü (ayrı tema)

### 6.3 Admin Panel Teması — Iron Man 1 Pepper Sahnesi (Açık Gri/Teal Glassmorphism)
- Arka plan: açık gri gradient (`#b8c4ce → #d0d8e0`)
- Glassmorphism paneller: `rgba(255,255,255,0.18)` + `backdrop-filter: blur`
- Teal/cyan aksan rengi: `#00b4c8`
- Sidebar: dosya listesi görünümü (Folder ikonları, tag badge'ler)

### 6.4 Scene3D — JARVIS Holografik Arayüz
- **Tema:** Koyu lacivert/siyah (`#020409`) — diğer admin sayfalarından farklı
- **Three.js / React Three Fiber** ile 3D sahne
- Arc Reactor merkez animasyonu, orbit halkalar, yıldız alanı, partiküller
- Her kanal bir 3D küp node olarak görünüyor (tıklanabilir, hover efektli)
- Sol/sağ HUD: gerçek backend verisi (toplam kullanıcı, mesaj, kanal, msgs/hour)
- JARVIS typewriter efekti (altta kayan yazı)
- 15 saniyede bir otomatik veri yenileme

### 6.5 Backend Admin Route'ları (`backend/src/routes/admin.ts`)
- `GET /api/admin/stats` — dashboard istatistikleri
- `GET /api/admin/users` — tüm kullanıcılar
- `DELETE /api/admin/users/:id` — kullanıcı sil
- `GET /api/admin/channels` — kanallar
- `GET /api/admin/messages` — sayfalı mesaj logu
- `DELETE /api/admin/messages/:id` — mesaj sil
- `GET /api/admin/analytics` — 3D sahne için canlı veri

---

## 7. CHAT FRONTEND TEMASI — AÇIK GRİ/TEAL GLASSMORPHISM + DARK/LIGHT TOGGLE (22 Mart 2026)

### 7.1 Tema Değişikliği
Admin panelin açık gri/teal glassmorphism teması chat frontend'e de uygulandı.
- CSS custom properties (variables) ile iki tema: light (`:root`) ve dark (`.dark`)
- `document.documentElement.classList.toggle('dark', dark)` ile geçiş
- Tercih `localStorage`'a kaydediliyor (`stark_theme`)
- Toggle butonu: sidebar üstünde + header'da (Sun/Moon ikonu, Lucide)
- `chat-arka-plan.png` arka plan olarak eklendi — dark modda `rgba(13,17,23,0.82)` overlay, light modda `rgba(200,208,216,0.78)` overlay

### 7.2 Güncellenen Dosyalar
- `frontend/src/index.css`, `frontend/src/App.tsx`, `frontend/src/components/Chat.tsx`
- `frontend/src/components/Login.tsx`, `frontend/src/components/ActiveUsersList.tsx`
- `frontend/src/components/DirectMessage.tsx`, `frontend/src/components/SettingsModal.tsx`
- `frontend/src/components/ChannelModal.tsx`, `frontend/src/components/UserProfileModal.tsx`

---

## 8. DESKTOP ELECTRON UYGULAMASI (22-23 Mart 2026)

### 8.1 Stack
- Electron 29 + Vite + React + TailwindCSS
- `desktop/` klasörü — ayrı proje
- Custom titlebar (minimize/maximize/close)
- Server config ekranı (hangi backend'e bağlanacağını ayarlama)
- Dark/light toggle titlebar'da

### 8.2 Build Durumu
- VDS Ubuntu'da Node.js v12 vardı → nvm ile Node 20 kuruldu
- `npm install` tamamlandı (464 paket)
- `npm run build:linux` başarıyla çalıştı
- **`StarkChat-Setup-1.0.0.AppImage` — 104MB — oluşturuldu**
- Konum: `~/stark-industries-chat/stark-industries-chat/desktop/release/`

### 8.3 Download Sistemi
- `frontend/src/pages/DownloadPage.tsx` — `/download` route'u, Windows + Linux indirme kartları
- `frontend/src/components/DownloadBanner.tsx` — Chat içinde sağ altta çıkan banner
- `backend/src/index.ts` — `/api/download/latest` endpoint + `/downloads/` static serve
- `Caddyfile` — `/downloads/*` route eklendi
- Login ekranına "PC UYGULAMASINI İNDİR" butonu eklendi

### 8.4 Mevcut Sorun — Download Endpoint Çalışmıyor
- `docker-compose.yml`'e volume eklendi: `./desktop/release:/app/desktop/release:ro`
- `docker inspect` ile mount doğrulandı — volume doğru bağlı
- Ama backend `RELEASE_DIR` path'i yanlış hesaplıyor:
  - `__dirname` = `/app/src` → `../../desktop/release` = `/desktop/release` (yanlış)
  - Olması gereken: `/app/desktop/release`
- **Çözüm:** `backend/src/index.ts`'de RELEASE_DIR satırı şöyle olmalı:
  ```ts
  const RELEASE_DIR = process.env.RELEASE_DIR || "/app/desktop/release";
  ```
- `docker-compose.yml`'e `- RELEASE_DIR=/app/desktop/release` env eklenmeli
- Bu PC'deki (Kiro workspace) dosyalar güncellendi ama VDS'ye henüz yansımadı

### 8.5 VDS'ye Uygulanacak Komutlar
```bash
# 1. index.ts'i düzelt
sed -i 's|const RELEASE_DIR = .*|const RELEASE_DIR = process.env.RELEASE_DIR || "/app/desktop/release";|' ~/stark-industries-chat/stark-industries-chat/backend/src/index.ts

# 2. docker-compose.yml'e env ekle (eğer yoksa)
# backend environment bloğuna şunu ekle:
#   - RELEASE_DIR=/app/desktop/release

# 3. Rebuild
cd ~/stark-industries-chat/stark-industries-chat
docker compose up -d --build backend
```

---

## 9. ALTYAPI VE DEPLOYMENT

### 9.1 VDS Bilgileri
- **IP:** 213.142.151.173
- **OS:** Ubuntu (masaüstü arayüzlü)
- **Domain:** stark.net.tr (chat), admin.stark.net.tr (admin panel)
- **Reverse Proxy:** Caddy (otomatik SSL)
- **Komut:** `docker compose up -d --build`
- **Node.js:** nvm ile v20.20.1 kuruldu (sistem Node'u v12'ydi)

### 9.2 Docker Container'lar
| Container | Servis | Port |
|---|---|---|
| stark_db | PostgreSQL 15 | 5432 |
| stark_backend | Node.js/Express | 5000 |
| stark_frontend | React/Nginx | 5173 |
| stark_admin | React/Nginx | 5174 |
| stark_caddy | Caddy proxy | 80/443 |

### 9.3 Prisma / DB
- Migration: `backend/prisma/migrations/20260321000000_add_dm_and_file_support/`
- `DirectMessage` modeli: `senderId`, `receiverId`, `content`, `fileUrl`, `fileType`, `fileName`
- `Message` modeline `fileUrl`, `fileType`, `fileName` eklendi

### 9.4 İlk Admin Kullanıcısı Yapma
```bash
docker exec -it stark_backend npx prisma studio
# veya direkt SQL:
# UPDATE "User" SET role = 'ADMIN' WHERE username = 'kullanici_adi';
```

### 9.5 Önemli Not — Kiro vs VDS Farkı
Kiro (bu IDE) üzerinden yapılan kod değişiklikleri sadece bu PC'deki dosyalara yansıyor.
VDS'ye aktarmak için ya git push/pull ya da VDS terminalinde manuel düzenleme gerekiyor.

---

## SONRAKI ADIMLAR (TODO)
1. VDS'de `backend/src/index.ts` RELEASE_DIR satırını düzelt → rebuild → download endpoint çalışacak
2. `.exe` (Windows) build için GitHub Actions pipeline kurulabilir
3. `desktop/` için özel uygulama ikonu eklenebilir (`electron-builder.json`'da `icon` alanı)

*"Ben J.A.R.V.I.S., bu dosyayı bana okutmanız halinde güncel bellek durumuma anında erişebilirim efendim."*
