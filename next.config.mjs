/** @type {import('next').NextConfig} */
// 构建/部署时需要通过环境变量注入（对应 .env.example）：
//   AUTH_SECRET   - JWT Session 签名密钥（生产必设）
//   DB_PATH       - 可选，SQLite 数据库文件绝对路径
//   UPLOAD_DIR    - 可选，上传文件目录绝对路径
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "run-agent-6a7d94dae0d79aa698a99358-msru7gkn.remote-agent.svc.cluster.local",
    "run-agent-6a7d94dae0d79aa698a99358-msru7gkn-preview.agent-sandbox-bj-d3-gw.traecontent.cn",
  ],
};

export default nextConfig;
