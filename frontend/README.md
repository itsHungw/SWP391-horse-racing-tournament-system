# Horse Racing Tournament Frontend

Frontend cho hệ thống Horse Racing Tournament, dùng React, TypeScript, Vite, Tailwind CSS, React Router và Axios.

## Yêu cầu

- Node.js 22 trở lên
- npm 11 trở lên

Kiểm tra phiên bản:

```bash
node --version
npm --version
```

## Cài đặt

Từ thư mục gốc project:

```bash
cd frontend
npm install
```

## Chạy môi trường dev

```bash
npm run dev
```

Mặc định Vite sẽ mở server tại:

```text
http://localhost:5173/
```

Nếu muốn bind rõ host/port:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

## Cấu hình API

Frontend dùng Axios client tại `src/api/httpClient.ts`.

Mặc định API base URL là:

```text
/api
```

Để đổi endpoint backend, tạo file `.env.local` trong thư mục `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Sau khi đổi `.env.local`, cần restart dev server.

## Scripts

```bash
npm run dev
```

Chạy Vite dev server.

```bash
npm run build
```

Type-check và build production vào thư mục `dist/`.

```bash
npm run preview
```

Preview bản production build.

```bash
npm test -- --run
```

Chạy test một lần bằng Vitest.

```bash
npm test
```

Chạy Vitest ở watch mode.

## Cấu trúc chính

```text
src/
  api/          Axios client và API services
  components/   Component dùng lại
  hooks/        React hooks dùng lại
  layouts/      Layout/app shell
  pages/        Page theo nhóm route
  routes/       Route definitions
```

## Route hiện có

- `/` - public home
- `/spectator`
- `/owner`
- `/jockey`
- `/referee`
- `/admin`

Các route theo role hiện là placeholder để nối tiếp phần auth, protected route và API thật.

## Kiểm tra trước khi commit

Chạy tối thiểu:

```bash
npm test -- --run
npm run build
```
