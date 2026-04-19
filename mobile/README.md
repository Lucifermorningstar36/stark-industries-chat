# Stark Industries Chat — Android Mobil Uygulama

Bu klasör, React web uygulamasını Android APK'ya dönüştüren **Capacitor** konfigürasyonunu içerir.

## Gereksinimler

| Araç | Min. Sürüm | İndirme |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Android Studio | Hedgehog (2023.1+) | https://developer.android.com/studio |
| JDK | 17+ | Android Studio ile gelir |
| Android SDK | API 34 | Android Studio SDK Manager |

---

## Kurulum (İlk Kez)

### 1. Frontend'i build et
```bash
cd ../frontend
npm install
npm run build
# dist/ klasörü oluşur
```

### 2. Mobile bağımlılıkları kur
```bash
cd ../mobile
npm install
```

### 3. Android projesini başlat
```bash
npx cap add android
npx cap sync android
```

### 4. Android Studio'da aç
```bash
npx cap open android
```

---

## Geliştirme Modu (Emülatör)

`capacitor.config.ts` dosyasında şu satırı aktif et:
```ts
server: { url: 'http://10.0.2.2:5173', cleartext: true },
```

Sonra frontend'i başlat:
```bash
cd ../frontend
npm run dev
```

Ve emülatörü çalıştır:
```bash
cd ../mobile
npx cap run android
```

---

## APK Build (Üretim)

### Debug APK (test için)
Android Studio → Build → Build Bundle(s) / APK(s) → Build APK(s)

**veya** terminal:
```bash
# mobile/android/ dizininde
./gradlew assembleDebug
# Çıktı: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (yayın için)
```bash
./gradlew assembleRelease
# İmzalama gerektirir — bkz. imzalama talimatları
```

---

## APK İmzalama (Yayın)

```bash
# Keystore oluştur (bir kez)
keytool -genkey -v -keystore stark-release.jks \
  -alias stark-key -keyalg RSA -keysize 2048 -validity 10000

# app/build.gradle'a ekle:
# signingConfigs { release { ... } }
```

---

## Android Manifest Özellikleri

Uygulama şu izinleri kullanır:
- `INTERNET` — sunucu bağlantısı
- `RECORD_AUDIO` — ses kanalları
- `CAMERA` — video görüşmesi
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` — dosya paylaşımı
- `RECEIVE_BOOT_COMPLETED` — bildirimler
- `POST_NOTIFICATIONS` (Android 13+) — push bildirimler

---

## Uygulama Özellikleri

- **Minimum:** Android 7.0 (API 24)
- **Hedef:** Android 14 (API 34)
- **WebView:** Chrome 60+
- **Tema:** Koyu, immersive tam ekran
- **Oryantasyon:** Portrait + Landscape

---

## Notlar

- Uygulama `https://stark.net.tr` adresini WebView içinde yükler
- Push bildirimleri Firebase Cloud Messaging (FCM) ile çalışır
- `google-services.json` dosyası FCM kurulumu için gereklidir
  - Firebase Console → Proje → Android App ekle → dosyayı `android/app/` içine koy
