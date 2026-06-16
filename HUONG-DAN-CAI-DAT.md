# Hướng dẫn đưa app World Cup 2026 lên iPhone

App này lấy dữ liệu thật từ **API-Football**. Làm theo 4 bước dưới đây, khoảng 15–20 phút là xong. Không cần biết lập trình.

---

## Tổng quan bạn sẽ làm gì

1. Lấy chìa khóa (API key) miễn phí từ API-Football.
2. Đưa bộ mã nguồn này lên Vercel (dịch vụ host miễn phí) để có một đường link web.
3. Dán API key vào Vercel.
4. Mở link bằng Safari trên iPhone → thêm icon ra màn hình chính.

---

## Bước 1 — Lấy API key miễn phí

1. Vào **https://www.api-football.com/** → bấm **Sign Up** (đăng ký bằng email, không cần thẻ tín dụng).
2. Sau khi đăng nhập, vào **Dashboard** → mục **My Access** hoặc **API Key**.
3. Copy chuỗi key (một dãy chữ số dài). Giữ kín, đừng để lộ.

> Gói miễn phí cho ~100 lượt gọi/ngày — đủ dùng cá nhân. App đã bật bộ nhớ đệm để tiết kiệm.

---

## Bước 2 — Đưa mã nguồn lên GitHub rồi Vercel

**Cách dễ nhất (không cần dòng lệnh):**

1. Tạo tài khoản **GitHub** (github.com) nếu chưa có.
2. Tạo một **repository mới** (New repository), đặt tên ví dụ `worldcup-2026`.
3. Bấm **uploading an existing file** rồi kéo thả TẤT CẢ các file trong thư mục này lên (giữ nguyên cấu trúc: thư mục `api/`, thư mục `src/`, và các file `index.html`, `package.json`, `vite.config.js`). Bấm **Commit**.
4. Vào **https://vercel.com/** → đăng nhập bằng tài khoản GitHub.
5. Bấm **Add New… → Project** → chọn repo `worldcup-2026` vừa tạo → bấm **Import**.
6. Vercel tự nhận đây là dự án Vite. Giữ nguyên mọi thiết lập, **KHOAN bấm Deploy** — sang Bước 3 trước.

---

## Bước 3 — Dán API key vào Vercel (quan trọng)

Trong màn hình Import của Vercel, mở mục **Environment Variables** và thêm:

| Name (tên biến)      | Value (giá trị)              |
|----------------------|------------------------------|
| `API_FOOTBALL_KEY`   | *(dán API key ở Bước 1 vào)* |

Sau đó bấm **Deploy**. Chờ 1–2 phút, Vercel cho bạn một đường link dạng:
`https://worldcup-2026-xxxx.vercel.app`

> Để API key trong Environment Variables nghĩa là nó nằm ở máy chủ, không lộ ra cho người dùng — an toàn.

Nếu sau này muốn đổi key: vào **Settings → Environment Variables** của dự án trên Vercel, sửa rồi **Redeploy**.

---

## Bước 4 — Thêm app ra màn hình chính iPhone

1. Mở **Safari** trên iPhone, vào đường link Vercel ở Bước 3.
2. Bấm nút **Chia sẻ** (hình vuông có mũi tên đi lên, ở thanh dưới).
3. Chọn **Thêm vào MH chính** (Add to Home Screen) → bấm **Thêm**.
4. Xong! Một icon "World Cup 2026" xuất hiện trên màn hình chính. Mở ra chạy toàn màn hình, không thanh địa chỉ — y như app thật.

---

## Câu hỏi thường gặp

**App báo lỗi "Thiếu API_FOOTBALL_KEY"?**
→ Bạn quên dán key ở Bước 3, hoặc gõ sai tên biến. Tên phải đúng chính xác là `API_FOOTBALL_KEY`. Sửa trong Settings → Environment Variables rồi Redeploy.

**Không thấy bảng nào / danh sách trống?**
→ Có thể mã giải đấu (league id) của World Cup trên API-Football khác `15` ở mùa này, hoặc lịch chưa được API cập nhật. Báo tôi, tôi chỉnh lại id trong file `src/App.jsx` (dòng `WC_LEAGUE_ID`).

**Hết lượt gọi trong ngày?**
→ Gói free giới hạn ~100 lượt/ngày. Mở lại app ngày hôm sau, hoặc nâng gói Pro của API-Football nếu dùng nhiều.

**Dữ liệu trọng tài / dự đoán đôi khi trống?**
→ API chỉ có dữ liệu này cho một số trận. Trận nào API chưa có thì app hiển thị "—". Đây là giới hạn của nguồn dữ liệu, không phải lỗi app.

---

*Người viết app: Phạm Anh Khoa*
