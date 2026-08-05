import Link from "next/link";

const features = [
  {
    title: "Đồng hồ blind chính xác",
    desc: "Đếm ngược dựa trên mốc thời gian thực, không lệch dù tab bị treo hay đổi thiết bị.",
  },
  {
    title: "Đa màn hình đồng bộ",
    desc: "Mở màn hình điều khiển và bao nhiêu màn hình hiển thị tùy thích, tất cả tự đồng bộ real-time.",
  },
  {
    title: "Tính blind & giải thưởng tự động",
    desc: "Nhập số người chơi và stack khởi điểm, hệ thống tự tạo cấu trúc blind và tỷ lệ chia giải hợp lý.",
  },
  {
    title: "Quản lý người chơi",
    desc: "Theo dõi rebuy, loại người chơi, tính quỹ giải thưởng theo thời gian thực.",
  },
  {
    title: "Không cần tài khoản",
    desc: "Tạo giải đấu và chạy ngay trên trình duyệt. Đăng ký chỉ khi cần lưu trên nhiều thiết bị.",
  },
  {
    title: "Miễn phí, không quảng cáo",
    desc: "Không theo dõi người dùng, không quảng cáo gây phân tâm trong lúc chơi.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Đồng hồ giải đấu Poker cho mọi sòng nhà, sự kiện
        </h1>
        <p className="max-w-xl text-lg text-zinc-500">
          Miễn phí. Không quảng cáo. Không cần tài khoản — bắt đầu ngay lập tức.
        </p>
        <Link
          href="/tournaments/new"
          className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400"
        >
          Tạo giải đấu ngay
        </Link>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
          >
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
