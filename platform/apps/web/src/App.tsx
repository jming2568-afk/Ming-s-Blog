import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { Landing } from "./pages/Landing.js";
import { Login } from "./pages/Login.js";
import { Register } from "./pages/Register.js";
import { AppHome } from "./pages/AppHome.js";
import { PublicResume } from "./pages/PublicResume.js";
import { NotFound } from "./pages/NotFound.js";

export function App() {
  return (
    <Routes>
      {/* 公共分享页：独立布局（无站内导航） */}
      <Route path="/r/:slug" element={<PublicResume />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<AppHome />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
