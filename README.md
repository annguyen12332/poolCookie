# Cookie Manager - Quản lý Cookie và Chuyển đổi Tài khoản

## Mô tả
Cookie Manager là một extension trình duyệt giúp bạn quản lý cookies và dễ dàng chuyển đổi giữa các tài khoản khác nhau trên các website. Extension này cho phép bạn lưu trữ, quản lý và sử dụng lại cookies đã lưu.

## Tính năng chính
- **Lưu trữ Cookies**: Lưu cookies hiện tại của website đang truy cập
- **Quản lý Cookies**: Xem danh sách tất cả cookies đã lưu theo domain
- **Chuyển đổi Tài khoản**: Sử dụng cookies đã lưu để đăng nhập vào tài khoản khác
- **Lọc theo Domain**: Dễ dàng tìm kiếm cookies theo tên miền cụ thể
- **Xóa Cookies**: Xóa cookies đã chọn hoặc xóa tất cả

## Cài đặt

### Yêu cầu hệ thống
- Trình duyệt Chrome/Edge (hỗ trợ Manifest V3)
- Quyền truy cập cookies và storage

### Cách cài đặt
1. Tải xuống hoặc clone repository này về máy
2. Mở trình duyệt Chrome/Edge
3. Vào `chrome://extensions/` (Chrome) hoặc `edge://extensions/` (Edge)
4. Bật chế độ "Developer mode" (Chế độ nhà phát triển)
5. Click "Load unpacked" (Tải extension chưa đóng gói)
6. Chọn thư mục chứa extension
7. Extension sẽ được cài đặt và hiển thị trên thanh công cụ

## Hướng dẫn sử dụng

### 1. Lưu Cookies hiện tại
- Truy cập website mà bạn muốn lưu cookies
- Click vào icon Cookie Manager trên thanh công cụ
- Click nút **"Save Cookie"** để lưu cookies hiện tại
- Cookies sẽ được lưu với thông tin domain và thời gian

### 2. Xem danh sách Cookies đã lưu
- Mở popup của extension
- Danh sách cookies sẽ hiển thị với checkbox để chọn
- Sử dụng dropdown **"Domain Filter"** để lọc cookies theo domain cụ thể
- Chọn "All Domains" để xem tất cả cookies

### 3. Sử dụng Cookies đã lưu
- Chọn một hoặc nhiều cookies bằng checkbox
- Click nút **"Use Selected Cookie(s)"**
- Extension sẽ áp dụng cookies đã chọn vào website hiện tại
- Trang web sẽ tự động reload để áp dụng cookies mới

### 4. Xóa Cookies
- **Xóa cookies đã chọn**: Chọn cookies cần xóa và click **"Clear Selected/All"**
- **Xóa tất cả**: Không chọn cookies nào và click **"Clear Selected/All"**
- Xác nhận hành động khi được hỏi

## Cấu trúc file
```
manager_cookie/
├── manifest.json          # Cấu hình extension
├── popup.html            # Giao diện popup
├── popup.js              # Logic xử lý popup
├── background.js         # Service worker
├── icon.png              # Icon extension
└── README.md             # Hướng dẫn sử dụng
```

## Quyền yêu cầu
Extension yêu cầu các quyền sau để hoạt động:
- **cookies**: Để đọc và ghi cookies
- **storage**: Để lưu trữ dữ liệu cục bộ
- **activeTab**: Để truy cập tab hiện tại
- **scripting**: Để reload trang web
- **host_permissions**: Quyền truy cập tất cả URL

## Lưu ý quan trọng
⚠️ **Cảnh báo bảo mật**:
- Cookies chứa thông tin đăng nhập nhạy cảm
- Chỉ sử dụng extension trên các website đáng tin cậy
- Không chia sẻ cookies với người khác
- Xóa cookies không cần thiết để bảo mật

## Xử lý sự cố

### Extension không hiển thị
- Kiểm tra extension đã được bật trong `chrome://extensions/`
- Đảm bảo đã bật "Developer mode"

### Không thể lưu cookies
- Kiểm tra quyền truy cập cookies của trình duyệt
- Đảm bảo website cho phép lưu cookies

### Lỗi khi sử dụng cookies
- Kiểm tra cookies còn hạn sử dụng không
- Thử reload trang web sau khi áp dụng cookies

## Hỗ trợ
Nếu gặp vấn đề hoặc có câu hỏi:
1. Kiểm tra console của trình duyệt để xem lỗi
2. Đảm bảo đã cài đặt đúng cách
3. Kiểm tra quyền truy cập của extension

## Phiên bản
- **Version**: 1.0
- **Manifest Version**: 3
- **Tương thích**: Chrome 88+, Edge 88+

---
**Cookie Manager** - Giải pháp quản lý cookies đơn giản và hiệu quả!
