# Stark Industries Chat - VDS Kurulum Rehberi

Bu proje, Ubuntu 22.04 VDS (Virtual Dedicated Server) üzerinde **Docker Compose** kullanılarak tamamen izole ve sorunsuz çalışacak şekilde tasarlanmıştır. Projeyi canlıya almak için aşağıdaki adımları sırasıyla uygulayın.

## 1. Projeyi VDS'e Aktarma (Upload)

Kendi bilgisayarınızda bulunan `stark-industries-chat` klasörünü VDS'inize aktarmanız gerekir:
- **WinSCP** veya **FileZilla** gibi bir FTP programı kullanarak Ubuntu sunucunuza SFTP ile bağlanın.
- Masaüstünüzdeki `stark-industries-chat` içerisindeki dosyaları sunucunuzdaki root dizinine (veya `/opt/stark-industries-chat`) kopyalayın.
- Alternatif olarak Git kullanıyorsanız, kodu GitHub'a atıp `git clone` komutuyla sunucunuza çekebilirsiniz.

---

## 2. Domain (stark.net.tr) Yönlendirmesi (ÇOK ÖNEMLİ)

Bu proje artık IP adresi yerine doğrudan `stark.net.tr` domaini üzerinden çalışacak şekilde yapılandırılmıştır. Sistemde bulunan Nginx Reverse Proxy ile tüm trafik otomatik route edilir.
- Yapmanız gereken **TEK ŞEY**, alan adı sağlayıcınızın paneline gidip `stark.net.tr` için VDS sunucunuzun IP adresine bir **A Kaydı** (A Record) oluşturmaktır.
- `docker-compose.yml` içerisindeki `VITE_API_URL` ve `FRONTEND_URL` değişkenleri otomatik olarak `<http://stark.net.tr>` adresine göre ayarlanmıştır, kodda hiçbir API portunu veya IP'yi değiştirmenize gerek kalmamıştır.

---

## 3. Ubuntu VDS Üzerine Docker ve Docker Compose Kurulumu

Windows terminalinizden (veya PuTTY kullanarak) sunucunuza SSH bağıntısı sağlayın:
```bash
ssh root@<vds-ip-adresi>
```

Ardından aşağıdaki komutları tek tek kopyalayıp terminale yapıştırarak gerekli altyapıyı kurun:

### Sistemi ve Paketleri Güncelle:
```bash
sudo apt update && sudo apt upgrade -y
```

### Docker'ı Kur:
```bash
sudo apt install docker.io -y
sudo systemctl enable --now docker
```

### Docker Compose'u Kur:
```bash
sudo apt install docker-compose -y
```

---

## 4. Projeyi Çalıştırma

Projenizi aktardığınız klasöre gidin (örneğin `/root/stark-industries-chat` içine attıysanız):
```bash
cd /root/stark-industries-chat
```

Ve arka planda tüm veritabanı, frontend ve backend containerlarını başlatan sihirli komutu girin:
```bash
sudo docker-compose up -d --build
```

### İşlem Tamamlandıktan Sonra Ne Olacak?
1. **Veritabanı (PostgreSQL):** Kendi container'ı içinde oluşup yayına girecek.
2. **Backend (Node.js):** Otomatik veritabanı kurulumlarını yapıp iç ağda 5000 portunda yayına girecek.
3. **Frontend (Vite+React):** 5173 portunda çalışacak.
4. **Nginx Reverse Proxy:** 80 portunu dinleyecek ve gelen tüm `stark.net.tr` isteklerini güvenle arka plana (Frontend ve Backend'e) dağıtacak.

Kurulum tamamlandıktan sonra tarayıcınıza sadece **`http://stark.net.tr`** yazarak kendi kurumsal chat uygulamanıza giriş yapabilirsiniz! 🚀

## 5. Sorun Giderme (Logları İzleme)
Eğer beyaz ekran alırsanız ya da backend'de bir sunucu hatası olursa şu komutla her şeye bakabilirsiniz:
```bash
sudo docker-compose logs -f
```
Bu komuttan çıkmak için `CTRL + C` tuşlarına basabilirsiniz.
