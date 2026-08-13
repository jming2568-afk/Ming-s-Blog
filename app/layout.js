import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getContent } from "@/lib/content";

export const metadata = {
  title: "李佳铭 | AIGC 漫剧制片 / 全栈开发工程师",
  description:
    "李佳铭个人作品集 — 1 年 AI 漫剧一线生产与管理经验 + 企业级 AIGC 平台独立开发经验。红果收藏破 100 万，累计产出 400+ 集，成本降低约 30%。",
  keywords: ["李佳铭", "AIGC", "漫剧", "全栈开发", "Next.js", "作品集", "简历"],
};

export default async function RootLayout({ children }) {
  const content = await getContent();
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer profile={content.profile} />
      </body>
    </html>
  );
}
