# CUN Poker Timer

Đồng hồ giải đấu Poker Texas Hold'em miễn phí — đa màn hình, real-time, không
cần tài khoản. Xây dựng cho `cun.poker.vn`.

## Chạy local

```bash
npm install
npm run db:migrate   # tạo database SQLite lần đầu
npm run dev           # http://localhost:3000
```

`npm run dev` khởi động custom server (`server.ts`) — Next.js + Socket.IO
chạy chung trên 1 process, cần thiết vì đồng bộ đa màn hình dùng WebSocket.

## Cấu trúc chính

- `server.ts` — custom Node server, gắn Socket.IO vào Next.js, xử lý
  toàn bộ logic điều khiển giải đấu real-time (`join` / `action` events).
- `src/lib/timerEngine.ts` — tính toán đồng hồ đếm ngược dựa trên timestamp
  (không dùng đếm tick, chống lệch khi tab bị treo).
- `src/lib/blindCalculator.ts`, `src/lib/prizeCalculator.ts` — tự sinh cấu
  trúc blind và tỷ lệ chia giải.
- `src/lib/sessionReducer.ts` — reducer thuần áp dụng các hành động điều
  khiển (start/pause/next/...) lên trạng thái giải đấu.
- `src/components/ControlView.tsx` / `DisplayView.tsx` — 2 giao diện chính:
  màn hình điều khiển và màn hình hiển thị (cho TV/máy chiếu).
- `prisma/schema.prisma` — schema database (User, Tournament).

## Kiến trúc quyền truy cập

- Không đăng nhập: mỗi trình duyệt được gán 1 `cun_anon` cookie (xem
  `src/proxy.ts`), giải đấu tạo ở chế độ khách gắn với cookie này.
- Đăng nhập: giải đấu gắn với `userId`, truy cập được từ mọi thiết bị.
- `/tournament/[id]/display` không cần quyền — bất kỳ ai có link đều xem
  được (dùng để mở trên TV/máy chiếu dùng chung).
- `/tournament/[id]/control` cần là chủ sở hữu (qua `userId` hoặc `anonId`).

## Deploy lên cun.poker.vn

Xem hướng dẫn chi tiết ở [DEPLOY.md](./DEPLOY.md).

## Việc chưa làm (phase sau)

- Display Designer (tùy biến giao diện màn hình hiển thị)
- Import ảnh chip tùy chỉnh
- Phát nhạc/YouTube nền
- Xuất báo cáo giải đấu chi tiết sau khi kết thúc
- Table management (chia bàn tự động)
