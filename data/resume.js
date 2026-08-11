// 两版简历结构化数据（与优化版 md 对齐）
export const resumeVersions = {
  aigc: {
    id: "aigc",
    label: "AIGC 漫剧制片",
    title: "AI 漫剧制作组长 / AI 漫剧制片 / AIGC 内容生产管理",
    summary:
      "1 年 AI 漫剧一线生产与管理经验，入职 9 个月内两次晋升（制作岗 → 组长 → 技术部负责人）。参与首部漫剧《重生之一条蛇》红果平台收藏破 100 万；带领 5-6 人团队并行交付 6+ 部漫剧（累计 400+ 集）；建立五步标准化生产流程；独立开发企业内部 AIGC 生产平台，成本降低约 30%。",
    workExperience: [
      {
        company: "湖北优阅文化传媒有限公司",
        period: "2025.11 – 2026.08",
        role: "动态漫部 6 组组长（2026.02 晋升）→ 技术部负责人（2026.05 晋升）",
        points: [
          "入职首月即交付爆款《重生之一条蛇》（红果收藏 100 万+），3 个月后升任组长",
          "带领 5-6 人团队并行推进多部漫剧（累计 400+ 集），负责任务拆解、进度排期、质量把控与甲方沟通",
          "建立「初模设计→定模→资产建立→成片制作→审核交付」五步标准流程，配套提示词审阅与素材复用机制",
          "推行项目排期倒排、任务拆解到集到人、质量门禁（多轮修改 + 高清审核）、阶段性交付与甲方审阅",
          "将 Seedance 2.0、Vidu Q3 等多模态生成能力引入生产，沉淀提示词库，主导技术知识库建设（21 条索引 + 12 篇 API 文档）",
          "独立开发企业内部 AIGC 生产平台「优阅漫剧助手」，成本降低约 30%（软著归个人）",
        ],
      },
    ],
    works: [
      { name: "《重生之一条蛇》", role: "核心制作成员", result: "红果收藏破 100 万，3D 版 64 集，6 人团队" },
      { name: "《乡村神医》", role: "组长 / 全流程统筹", result: "60+ 集，统筹初模到成片全流程" },
      { name: "《斩龙》", role: "组长", result: "人设建模 + 场景拆分提示词体系" },
      { name: "《慷慨大师兄》", role: "组长 / 制作统筹", result: "78 集，人物/场景/道具资产体系" },
      { name: "《重生二哈》", role: "制作负责人 / 剪辑负责人", result: "76 集，多版本交付流程" },
      { name: "《托寡》", role: "组长 / 制作统筹", result: "92 集，全流程统筹" },
    ],
    abilities: [
      { item: "AI 内容生产", desc: "Seedance 2.0 / Vidu Q3 / Seedream；提示词工程、多模态参考、素材资产管理" },
      { item: "制作管理", desc: "排期倒排、任务拆解到集到人、质量门禁、甲方沟通、团队带教" },
      { item: "流程搭建", desc: "五步标准化生产流程；多版本交付流程；从 0 到 1 搭建协作平台" },
      { item: "成本与质量", desc: "平台化工具降本约 30%；视频质量分级（mini/fast/full）" },
      { item: "技术加分项", desc: "全栈开发（Next.js / TS / PostgreSQL / Docker）、AI Agent、NAS 运维" },
    ],
    education: [
      { period: "2021.09 – 2023.09", school: "武警西藏总队山南支队", desc: "个人嘉奖一次、四有优秀士兵一次" },
      { period: "2018 – 2021", school: "武汉铁路职业技术学院", desc: "大专 · 电子商务" },
      { period: "2023.09 – 2025.10", school: "技能提升期", desc: "黄冈职业技术学院电工培训（结业）+ 自学全栈" },
    ],
    certs: "电工职业技能等级证书（中级）｜ 普通话二级甲等 ｜ 驾驶证 C1",
  },
  dev: {
    id: "dev",
    label: "全栈开发工程师",
    title: "全栈工程师 / AI 应用开发工程师",
    summary:
      "具备企业级 AI 应用独立交付经验的全栈开发者。独立设计并上线服务真实生产团队的 AIGC 内容生产平台（Next.js 16 / React 19 / PostgreSQL / Redis / Docker），覆盖权限体系、异步任务队列、对象存储、成本核算与质量门禁全链路，上线后降低约 30% 生产成本。AI 协作开发深度实践者（Claude Code / Codex / 多 Agent 任务治理）。",
    workExperience: [
      {
        company: "湖北优阅文化传媒有限公司",
        period: "2025.11 – 2026.08",
        role: "技术部负责人 / 全栈工程师（9 个月内两次晋升）",
        points: [
          "独立承担公司几乎全部技术工作：生产平台开发、官网维护、NAS 搭建、企业内网部署",
          "任职组长期间带领 5-6 人团队并行交付多部 AI 漫剧（累计 400+ 集），将业务痛点转化为系统设计",
          "主导技术知识库建设，沉淀 21 条索引记录与 12 篇 API 技术文档",
        ],
      },
    ],
    projects: [
      {
        name: "优阅漫剧助手 — 企业级 AIGC 内容生产平台",
        role: "独立开发 · 2026.05 – 2026.08 · V0.5.9 · 软著归个人",
        points: [
          "Next.js 16（App Router）+ React 19 + Prisma + PostgreSQL 前后端一体，API Routes 承载 30+ 端点",
          "Redis 驱动 6 类业务 Worker（素材同步/任务轮询/结果归档/媒体元数据/后处理）",
          "Prisma 双 Schema（PostgreSQL formal 1728 行 + SQLite legacy 1543 行），覆盖用户/权限/项目/资产/任务/成本/输出全链路",
          "接入 Seedance 视频生成、TOS 对象存储、Stripe 支付、NextAuth 认证、GPT Image 2",
          "三级质量门禁 + Playwright Browser Acceptance Lane + MVP 回归脚本",
          "Docker 编排 Web/PostgreSQL/PgBouncer/Redis/Worker + 生产仿真环境（production-sim）",
        ],
      },
      {
        name: "Ignesis — 下一代 AIGC 创作平台（筹备期）",
        role: "产品与架构设计 · 2026.07",
        points: [
          "完成第一阶段产品 PRD 与架构契约，规划工作台/项目上下文/素材/生产/财务五大业务中心",
          "提出「只搬图纸、不复制旧实现」的继任策略，提炼业务约束与安全不变量",
        ],
      },
      {
        name: "AI 工程实践 — 飞书文档管家 Agent / 智能 HR Agent",
        role: "Agent 设计 · 2026.03",
        points: [
          "飞书文档 Agent 自动生成人物/道具/场景设计图表格，支持增量编辑",
          "Agent 创建顾问：需求访谈→方案设计→Skill 实现→验收的可复用流程",
          "主项目实践 AGENTS.md 协作模型、双 PRD、Skill 路由、多 Agent 任务治理",
        ],
      },
    ],
    techStack: [
      { cat: "前端与语言", items: "TypeScript / JavaScript / Node.js / Python；Next.js 16 / React 19 / Tailwind v4" },
      { cat: "数据与任务", items: "PostgreSQL / Prisma 6.19 / Redis / SQLite；异步 Worker、状态机、权限隔离、幂等" },
      { cat: "部署与运维", items: "Docker / PgBouncer / Git / WSL；质量门禁、回归测试、NAS、企业内网部署" },
      { cat: "AIGC 与存储", items: "Seedance 2.0 / Vidu Q3 / Seedream API；火山引擎 TOS；提示词工程" },
      { cat: "AI 工程实践", items: "Claude Code / Codex 协作、Agent 设计、Skill 路由、RAG 知识库、多 Agent 治理" },
    ],
    education: [
      { period: "2021.09 – 2023.09", school: "武警西藏总队山南支队", desc: "个人嘉奖一次、四有优秀士兵一次" },
      { period: "2018 – 2021", school: "武汉铁路职业技术学院", desc: "大专 · 电子商务" },
      { period: "2023.09 – 2025.10", school: "技能提升期", desc: "电工培训（结业）+ 自学全栈 + 兼职 IT 服务" },
    ],
    certs: "电工职业技能等级证书（中级）｜ 普通话二级甲等 ｜ 驾驶证 C1",
  },
};
