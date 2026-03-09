# AI 简历智能管理系统 · Demo

基于 Claude Opus 4.6 的企业级简历解析与岗位匹配系统演示

---

## 功能模块

| 模块 | 功能 |
|------|------|
| 01 · 批量解析 | PDF/Word/图片简历解析，自动分类打标签，数据脱敏 |
| 02 · 岗适其人 | 输入JD → 人才库按匹配度排序 |
| 03 · 人适其岗 | 输入简历 → 推荐最匹配岗位 Top3 |
| 04 · 简历生成器 | 对话式收集信息 → 生成规范简历（适合大龄员工）|
| 05 · 多语言解析 | 英/日/德文简历 → 结构化信息 + 中文摘要 |

---

## 本地启动（5分钟）

### 1. 克隆并配置

```bash
git clone https://github.com/your-username/resume-ai-demo
cd resume-ai-demo

# 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 ANTHROPIC_API_KEY
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
source ../.env  # 或 export ANTHROPIC_API_KEY=sk-ant-xxx
uvicorn main:app --reload --port 8000
# 访问 http://localhost:8000/docs 查看 API 文档
```

### 3. 启动前端（新终端）

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

---

## 部署到 Render + Vercel（推荐，免费）

### 后端 → Render

1. 登录 [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. 配置：
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 添加环境变量：`ANTHROPIC_API_KEY = sk-ant-xxx`
5. 部署完成后记录 URL，如：`https://resume-ai-backend.onrender.com`

### 前端 → Vercel

1. 登录 [vercel.com](https://vercel.com)
2. Import → 选择仓库 → 设置：
   - **Root Directory**: `frontend`
3. 添加环境变量：`VITE_API_URL = https://resume-ai-backend.onrender.com`
4. 部署完成，获得 URL：`https://resume-ai-demo.vercel.app`

---

## 或用 Docker 一键启动

```bash
cp .env.example .env  # 填入 API Key
docker-compose up --build
# 前端: http://localhost:5173
# 后端: http://localhost:8000
```

---

## API 文档

启动后端后访问 `http://localhost:8000/docs`

主要接口：
- `POST /api/parse-resumes` - 批量解析简历（multipart/form-data）
- `POST /api/match-by-jd` - JD 匹配候选人
- `POST /api/match-by-resume` - 简历推荐岗位
- `POST /api/generate-resume` - 生成简历
- `POST /api/translate-resume` - 多语言解析

---

## 技术栈

- **AI**: Anthropic Claude Opus 4.6（claude-opus-4-6）
- **后端**: Python FastAPI + Uvicorn
- **前端**: React 18 + Vite + Tailwind CSS
- **部署**: Render（后端）+ Vercel（前端）

---

## 数据安全说明

- 所有上传文件仅在内存中处理，**不落盘存储**
- 手机号自动脱敏（中间4位替换为****）
- API Key 通过环境变量注入，不写入代码
- 生产版本建议接入加密存储和访问控制
