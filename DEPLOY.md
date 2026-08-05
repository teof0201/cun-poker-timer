# Đưa CUN Poker Timer lên cun.poker.vn (miễn phí)

App này cần 1 nơi chạy được **Node.js server liên tục** (không phải static
site) vì dùng WebSocket (Socket.IO) để đồng bộ nhiều màn hình real-time —
Vercel/Netlify không phù hợp.

**Hướng A (free 100%) dùng Render.com.** Có 1 điều cần biết trước:

> Gói free của Render **không giữ ổ đĩa vĩnh viễn** — mỗi lần deploy code mới
> (khi tao cập nhật tính năng sau này), file database SQLite sẽ reset về
> rỗng. Việc này **không** xảy ra giữa lúc đang chơi (chỉ khi có bản deploy
> mới), nên không ảnh hưởng một ván đang chạy — chỉ mất lịch sử các giải đấu
> cũ. Nếu sau này mày muốn dữ liệu bền vĩnh viễn, có thể nâng cấp sang
> database ngoài (Supabase, free) — báo tao lúc đó.

---

## Hướng A — Render.com (free, khuyên dùng)

### Bước 1: Đưa code lên GitHub

1. Tạo tài khoản GitHub (nếu chưa có): https://github.com/signup
2. Tạo 1 repo mới (ví dụ tên `cun-poker-timer`), Private cũng được, **để
   trống** (không tick thêm README/gitignore).
3. GitHub sẽ cho mày 1 URL dạng `https://github.com/<user>/cun-poker-timer.git`.
   Trong thư mục project, chạy:

```bash
git remote add origin <URL_REPO>
git push -u origin main
```

(Code đã được `git init` + commit sẵn từ trước, mày chỉ cần 2 lệnh trên.)

### Bước 2: Tạo Web Service trên Render

1. Tạo tài khoản tại https://render.com (đăng nhập bằng GitHub cho tiện —
   Render sẽ tự thấy repo của mày).
2. Bấm **New** → **Web Service** → chọn repo `cun-poker-timer`.
3. Điền:
   - **Name**: `cun-poker-timer` (tùy ý)
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Branch**: `main`
   - **Build Command**: `npm install && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. Mục **Environment Variables**, thêm:
   - `DATABASE_URL` = `file:./prod.db`
   - `JWT_SECRET` = chuỗi bí mật (cách tạo ở cuối file)
   - `NODE_ENV` = `production`
5. Bấm **Create Web Service**. Lần build đầu mất vài phút — theo dõi log,
   nếu xong sẽ có link dạng `https://cun-poker-timer.onrender.com`.

### Bước 3: Gắn domain cun.poker.vn

1. Trong Render, vào tab **Settings** → **Custom Domain** → **Add Custom
   Domain** → nhập `cun.poker.vn`.
2. Render đưa ra 1 giá trị CNAME (dạng `cun-poker-timer.onrender.com`).
3. Vào nơi quản lý DNS của domain `poker.vn` (chỗ mày đã mua domain — kiểm
   tra email lúc mua nếu không nhớ), thêm bản ghi:
   - Loại: `CNAME`
   - Tên/Host: `cun`
   - Giá trị/Đích: giá trị Render vừa đưa
   - TTL: mặc định
4. Đợi 5–30 phút để DNS lan truyền. Render tự cấp SSL (HTTPS) miễn phí.

Xong — `https://cun.poker.vn` chạy được, ai vào cũng dùng miễn phí, không
cần tài khoản.

### Lưu ý khi dùng gói Free

- Nếu không ai truy cập trong ~15 phút, server "ngủ". Lượt truy cập tiếp
  theo mất khoảng 30–60 giây để "thức dậy" — chỉ ảnh hưởng lần tải trang
  đầu, sau đó chạy bình thường suốt buổi chơi.
- Trước mỗi buổi chơi quan trọng, nên mở thử trang trước ~1 phút để server
  "thức dậy" sẵn.

---

## Hướng B — VPS riêng (nếu đã có sẵn VPS, không free nhưng không bị ngủ)

Cần: 1 VPS Ubuntu 22.04+, đã có IP, đã SSH vào được.

```bash
# 1. Cài Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs git nginx

# 2. Clone code lên server
git clone <URL_REPO> /var/www/cun-poker-timer
cd /var/www/cun-poker-timer

# 3. Tạo file .env production
cat > .env << 'EOF'
DATABASE_URL="file:./prod.db"
JWT_SECRET="<dán chuỗi bí mật đã tạo ở dưới>"
PORT=3000
EOF

# 4. Cài dependency, build, migrate
npm install
npx prisma migrate deploy
npm run build

# 5. Cài PM2 để giữ server chạy nền + tự khởi động lại nếu crash
sudo npm install -g pm2
pm2 start npm --name cun-poker-timer -- start
pm2 save
pm2 startup   # chạy lệnh nó in ra để tự khởi động cùng server
```

### Cấu hình Nginx (reverse proxy + hỗ trợ WebSocket)

Tạo file `/etc/nginx/sites-available/cun.poker.vn`:

```nginx
server {
    listen 80;
    server_name cun.poker.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cun.poker.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Cài SSL miễn phí (Let's Encrypt)
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cun.poker.vn
```

### DNS

Vào nơi quản lý DNS của `poker.vn`, thêm bản ghi:
- Loại: `A`
- Tên/Host: `cun`
- Giá trị: địa chỉ IP của VPS

---

## Tạo JWT_SECRET an toàn

Chạy lệnh này (trên máy mày) và dán kết quả vào biến `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Không dùng lại** giá trị `dev-secret-change-in-production-CHANGE-ME` trong
file `.env` local khi lên production.

---

## Sau khi deploy

- Test bằng cách tạo 1 giải đấu, mở link `/control` trên máy mày và link
  `/display` trên một thiết bị khác (điện thoại/TV) — xác nhận đồng bộ real-time.
- Nếu sau này muốn dữ liệu không bao giờ mất khi deploy lại, báo tao chuyển
  `DATABASE_URL` sang Supabase Postgres (free, không hết hạn) — chỉ cần đổi
  connection string, không mất tính năng nào.
