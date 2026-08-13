/** @type {import('next').NextConfig} */
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
