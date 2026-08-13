/** @type {import('next').NextConfig} */
// 环境变量见 .env.example：
//   AUTH_SECRET            - 会话签名密钥（生产必设）
//   BLOB_READ_WRITE_TOKEN  - Vercel Blob 读写凭证（内容/媒体存储）
//   INIT_ADMIN_USERNAME / INIT_ADMIN_PASSWORD - 首次初始化管理员账号（可选，默认 useradmin / useradmin123）
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
