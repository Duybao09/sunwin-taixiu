# SunWin Tài Xỉu API (Phiên bản rút gọn)
Bộ code này giúp bạn deploy nhanh một API lấy dữ liệu từ WebSocket SunWin và trả dự đoán Tài/Xỉu.

## Nội dung trong zip
- `server.js` - server NodeJS (Fastify) kết nối WebSocket SunWin và cung cấp endpoint:
  - `GET /api/taixiu/sunwin` → trả kết quả hiện tại + dự đoán
  - `GET /api/taixiu/history` → trả lịch sử tải được
- `package.json` - dependencies
- `.gitignore`
- `README.md` (this file)
- `taixiu_history.json` (tạo tự động khi server chạy)
- `.env.example` - ví dụ biến môi trường

## Hướng dẫn từng bước từ đầu (chi tiết)
### 1) Chuẩn bị local
- Yêu cầu: Node 18+, npm
- Giải nén zip, mở terminal vào thư mục

### 2) Thiết lập biến môi trường
- Tạo file `.env` tại thư mục gốc với nội dung:
```
SUNWIN_TOKEN=token_của_bạn_vào_đây
PORT=3001
```
- **Lưu ý:** token bạn lấy từ request / web client của SunWin — nếu chưa biết, bạn cần inspect network khi chơi hoặc dùng token có sẵn.

### 3) Chạy local
```bash
npm install
npm start
```
- Kiểm tra: mở `http://localhost:3001/api/taixiu/sunwin`  
- Nếu server báo `SUNWIN_TOKEN chưa đặt`, kiểm tra lại `.env`.

### 4) Tạo GitHub repo và đẩy code
```bash
git init
git add .
git commit -m "Initial commit - sunwin taixiu api"
# tạo repo trên GitHub rồi:
git remote add origin https://github.com/yourname/sunwin-taixiu.git
git branch -M main
git push -u origin main
```

### 5) Deploy lên Render
1. Đăng nhập Render (https://render.com) → New → Web Service
2. Connect GitHub repo bạn vừa push
3. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node 18+
4. **Environment Variables (Render)**
   - `SUNWIN_TOKEN` = (token của bạn)
   - `PORT` = `10000` (hoặc để trống; Render cung cấp PORT)
5. Create → chờ deploy xong
6. Test: `https://your-service.onrender.com/api/taixiu/sunwin`

### 6) Lưu ý vận hành
- Nếu WebSocket disconnect, server tự reconnect.
- `taixiu_history.json` lưu lịch sử; không commit file này (đã có `.gitignore`)
- Nếu muốn chạy kèm nhiều game, có thể mở rộng bằng cách thêm fetcher tương tự.

## Kiểm tra nhanh bằng curl
```bash
curl https://your-service.onrender.com/api/taixiu/sunwin
```

## Hỗ trợ
Nếu bạn muốn mình:
- Tạo sẵn repository trên GitHub (bạn cần cấp link hoặc quyền)
- Deploy giúp bằng cách cung cấp token & quyền Render (lưu ý: không gửi token vào chat nếu bạn không muốn)
hãy báo mình biết.
