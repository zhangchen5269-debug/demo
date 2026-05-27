# MindLink - 校园失物招领 Demo

## 🚀 快速初始化命令

```bash
# 1. 进入项目目录
cd c:\Users\jia\Desktop\frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 📁 项目文件结构

```
mindlink/
├── public/                      # 静态资源
│   └── vite.svg                # Vite Logo
├── src/                        # 源代码目录
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── Button.tsx      # 按钮组件
│   │   │   ├── Input.tsx       # 输入框组件
│   │   │   ├── Modal.tsx       # 模态框组件
│   │   │   └── Card.tsx        # 卡片组件
│   │   ├── Header.tsx          # 页面头部
│   │   ├── SearchBar.tsx       # 搜索栏
│   │   ├── LostItemCard.tsx    # 失物卡片
│   │   ├── LostItemList.tsx    # 失物列表
│   │   ├── LostItemModal.tsx   # 登记失物模态框
│   │   └── DetailModal.tsx     # 失物详情模态框
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useLocalStorage.ts  # localStorage Hook
│   │   └── useLostItems.ts     # 失物数据管理 Hook
│   ├── types/                  # TypeScript 类型定义
│   │   └── lostItem.ts         # 失物类型定义
│   ├── utils/                  # 工具函数
│   │   └── api.ts             # DeepSeek API 集成
│   ├── App.tsx                # 主应用组件
│   ├── main.tsx               # 入口文件
│   └── index.css              # 全局样式
├── .gitignore                 # Git 忽略文件
├── index.html                 # HTML 入口
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind CSS 配置
├── postcss.config.js          # PostCSS 配置
└── README.md                  # 项目说明
```

## 🎨 设计规范

### 主题色彩
- **主色调**: #6366f1 (Indigo)
- **辅助色**: #22d3ee (Cyan)
- **背景色**: 柔和渐变 (Indigo → Cyan, 透明度调整)
- **文字色**: #1f2937 (深灰), #6b7280 (中灰)

### 设计风格
- **玻璃态设计 (Glassmorphism)**: 半透明背景 + 模糊效果
- **圆角**: 16px - 24px
- **阴影**: 柔和阴影 (box-shadow with blur)
- **动画**: framer-motion 实现流畅过渡

### 字体
- **主字体**: Inter, system-ui, sans-serif
- **中文字体**: "PingFang SC", "Microsoft YaHei", sans-serif

## 🔧 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **动画**: framer-motion
- **图标**: lucide-react
- **数据存储**: localStorage (模拟数据库)

## 📝 主要功能

### 1. 首页
- 失物卡片列表展示
- 搜索框快速筛选
- 一键登记失物按钮

### 2. 失物登记
- 点击按钮打开模态框
- 填写失物信息表单
- 提交后保存到 localStorage

### 3. 失物详情
- 点击卡片查看详情
- 玻璃态模态框展示
- 显示完整失物信息

### 4. DeepSeek API 集成 (可选)
- 智能匹配失物描述
- 自动生成失物标签
- 智能搜索推荐

## 🚀 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 📦 依赖说明

### 核心依赖
- `react`: ^18.2.0 - React 核心库
- `react-dom`: ^18.2.0 - React DOM 渲染
- `typescript`: ^5.0.0 - TypeScript 支持

### 开发依赖
- `vite`: ^5.0.0 - Vite 构建工具
- `@vitejs/plugin-react`: ^4.0.0 - React 插件
- `tailwindcss`: ^3.4.0 - Tailwind CSS
- `postcss`: ^8.4.0 - PostCSS 处理器
- `autoprefixer`: ^10.4.0 - 自动前缀处理

### 功能依赖
- `framer-motion`: ^10.16.0 - 动画库
- `lucide-react`: ^0.294.0 - 图标库
- `clsx`: ^2.0.0 - 条件类名合并

## 💡 使用提示

1. **数据持久化**: 所有数据保存在浏览器 localStorage 中
2. **刷新重置**: 清除浏览器缓存会导致数据丢失
3. **DeepSeek API**: 需要在 `src/utils/api.ts` 中配置 API Key
4. **响应式设计**: 移动端和桌面端均可正常使用

## 🎯 开发计划

- [x] 项目基础结构搭建
- [ ] 首页布局和样式
- [ ] 失物卡片组件
- [ ] 搜索功能
- [ ] 登记模态框
- [ ] 详情模态框
- [ ] localStorage 数据管理
- [ ] DeepSeek API 集成
- [ ] 响应式设计优化
- [ ] 动画效果完善

## 📄 许可证

本项目仅供学习和演示使用。
