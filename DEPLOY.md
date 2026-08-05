# Đưa CUN Poker Timer lên cun.poker.vn

App này có 2 điểm cần lưu ý khi chọn nơi host:

1. Nó chạy **server Node.js riêng** (không phải static site) vì cần WebSocket
   (Socket.IO) để đồng bộ nhiều màn hình real-time. Vercel/Netlify (dành cho
   site tĩnh/serverless) **không phù hợp**. Cần một nơi chạy được Node.js
   liên tục 24/7.
2. Database mặc định là SQLite (1 file `dev.db`) — đơn giản, đủ dùng cho quy
   mô sòng nhà/sự kiện nhỏ. File này cần được lưu ở ổ đĩa "bền" (persistent),
   không bị xóa mỗi lần deploy lại.

Có 2 hướng, chọn 1:

---

## Hướng A — Railway.app (khuyên dùng, dễ nhất, không cần biết SSH/Linux)

### Bước 1: Đưa code lên GitHub

1. Tạo tài khoản GitHub (nếu chưa có): https://github.com/signup
2. Tạo 1 repo mới (ví dụ tên `cun-poker-timer`), để **Private** cũng được.
3. Trong thư mục project, chạy các lệnh sau (thay `<URL_REPO>` bằng URL repo
   GitHub mày vừa tạo):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <URL_REPO>
git push -u origin main
```

### Bước 2: Tạo project trên Railway

1. Tạo tài khoản tại https://railway.app (đăng nhập bằng GitHub luôn cho tiện).
2. Bấm **New Project** → **Deploy from GitHub repo** → chọn repo vừa push.
3. Railway tự nhận diện đây là app Node.js.
4. Vào tab **Variables** của service, thêm 2 biến môi trường:
   - `DATABASE_URL` = `file:./data/prod.db`
   - `JWT_SECRET` = một chuỗi ngẫu nhiên dài, bí mật (xem cách tạo ở cuối file)
5. Vào tab **Settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Vào tab **Volumes** (rất quan trọng — nếu bỏ qua, dữ liệu giải đấu sẽ mất
   mỗi lần Railway deploy lại):
   - Tạo 1 volume, mount vào path `/app/data`
   - Việc này giữ file database `prod.db` không bị xóa.
7. Trước khi lần đầu chạy, cần áp migration cho DB. Vào tab **Settings** →
   thêm vào "Deploy" một lệnh chạy 1 lần, hoặc đơn giản nhất: mở tab
   **Shell/Console** của Railway (nếu có) và chạy:
   ```bash
   npx prisma migrate deploy
   ```
   Hoặc thêm vào Start Command thành:
   `npx prisma migrate deploy && npm start`

### Bước 3: Gắn domain cun.poker.vn

1. Trong Railway, vào tab **Settings** → **Networking** → **Custom Domain**.
2. Nhập `cun.poker.vn`, Railway sẽ cho một giá trị CNAME (dạng
   `xxxxx.up.railway.app`).
3. Vào nơi quản lý DNS của domain `poker.vn` (thường là chỗ mày đã mua domain
   — Nếu không nhớ, kiểm tra email lúc mua domain hoặc hỏi ai đứng tên mua).
4. Thêm 1 bản ghi DNS mới:
   - Loại: `CNAME`
   - Tên/Host: `cun`
   - Giá trị/Đích: giá trị Railway vừa đưa (`xxxxx.up.railway.app`)
   - TTL: để mặc định
5. Đợi 5–30 phút để DNS lan truyền. Railway sẽ tự cấp SSL (HTTPS) cho domain.

Xong — `https://cun.poker.vn` sẽ chạy app.

---

## Hướng B — VPS riêng (nếu đã có sẵn VPS Ubuntu)

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

Chạy lệnh này (trên máy mày hoặc trên VPS) và dán kết quả vào biến
`JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Không dùng lại** giá trị `dev-secret-change-in-production-CHANGE-ME` trong
file `.env` local khi lên production.

---

## Sau khi deploy

- Test bằng cách tạo 1 giải đấu, mở link `/control` trên máy mày và link
  `/display` trên một thiết bị khác (điện thoại/TV) — xác nhận đồng bộ real-time.
- Cân nhắc backup định kỳ file database (SQLite) nếu giải đấu quan trọng.
- Nếu sau này cần scale (nhiều giải đấu đồng thời, nhiều người dùng), cân
  nhắc chuyển `DATABASE_URL` sang Postgres (Railway có Postgres addon 1 click).
