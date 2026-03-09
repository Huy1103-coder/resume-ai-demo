from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from zhipuai import ZhipuAI
import base64
import json
import re
import io

app = FastAPI(title="AI Resume System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = ZhipuAI(api_key=os.environ.get("ZHIPU_API_KEY", ""))
MODEL_NAME = "glm-4v-flash"
TEXT_MODEL = "glm-4-flash"

BUSINESS_LINES = ["制造", "研发", "行政", "后勤", "销售", "其他"]

SAMPLE_JOBS = [
    {"id": "1", "title": "高级工程师", "dept": "研发", "requirements": "5年以上软件开发经验，熟悉Python/Java，有团队管理经验"},
    {"id": "2", "title": "生产主管", "dept": "制造", "requirements": "3年以上生产管理经验，熟悉精益生产，有质量管理体系认证"},
    {"id": "3", "title": "HR经理", "dept": "行政", "requirements": "5年以上人力资源管理经验，熟悉劳动法，有大型企业招聘经验"},
    {"id": "4", "title": "物流专员", "dept": "后勤", "requirements": "2年以上物流管理经验，熟悉ERP系统，有仓储管理经验"},
    {"id": "5", "title": "销售总监", "dept": "销售", "requirements": "8年以上销售经验，有大客户资源，熟悉B2B销售流程"},
    {"id": "6", "title": "数据分析师", "dept": "研发", "requirements": "3年以上数据分析经验，熟悉Python/SQL，有机器学习项目经验"},
]


def desensitize_phone(phone: str) -> str:
    """Mask middle 4 digits of phone number"""
    if phone and len(phone) >= 11:
        return phone[:3] + "****" + phone[7:]
    return phone


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from docx bytes"""
    try:
        import zipfile
        from xml.etree import ElementTree as ET
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            with z.open('word/document.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                texts = root.findall('.//w:t', ns)
                return ' '.join([t.text for t in texts if t.text])
    except Exception:
        return ""


async def parse_resume_with_claude(content: str, file_type: str, filename: str) -> dict:
    """Use Claude to parse resume content"""
    
    prompt_text = """请解析这份简历，提取以下信息并以JSON格式返回（只返回JSON，不要其他文字）：
{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "age": "年龄（数字）",
  "work_years": "工作年限（数字）",
  "education": "最高学历",
  "school": "毕业院校",
  "skills": ["技能1", "技能2"],
  "companies": ["公司1", "公司2"],
  "current_title": "当前/最近职位",
  "language": "简历语言（中文/英文/日文/德文/其他）",
  "summary": "200字以内的个人总结"
}
如果某字段无法识别，填null。"""

    if file_type in ["image/jpeg", "image/png", "image/jpg"]:
        # Vision mode for images
        message = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file_type};base64,{content}",
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt_text
                        }
                    ],
                }
            ],
        )
    else:
        # Text mode for PDF/DOCX
        message = client.chat.completions.create(
            model=TEXT_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": f"""请解析以下简历内容，提取关键信息并以JSON格式返回（只返回JSON，不要其他文字）：

简历内容：
{content}

返回格式：
{{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "age": "年龄（数字）",
  "work_years": "工作年限（数字）",
  "education": "最高学历",
  "school": "毕业院校",
  "skills": ["技能1", "技能2"],
  "companies": ["公司1", "公司2"],
  "current_title": "当前/最近职位",
  "language": "简历语言（中文/英文/日文/德文/其他）",
  "summary": "200字以内的个人总结"
}}
如果某字段无法识别，填null。"""
                }
            ],
        )
    
    try:
        raw = message.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        data = json.loads(raw)
        # Desensitize phone
        if data.get("phone"):
            data["phone_masked"] = desensitize_phone(data["phone"])
            data["phone_raw"] = data["phone"]
            data["phone"] = data["phone_masked"]
        data["filename"] = filename
        return data
    except Exception as e:
        return {"error": str(e), "filename": filename, "name": "解析失败", "summary": "无法解析该文件"}


async def classify_resume(resume_data: dict) -> dict:
    """Classify resume into business lines"""
    skills = ", ".join(resume_data.get("skills", []))
    title = resume_data.get("current_title", "")
    companies = ", ".join(resume_data.get("companies", []))
    
    message = client.chat.completions.create(
        model=TEXT_MODEL,
        max_tokens=200,
        messages=[
            {
                "role": "user",
                "content": f"""根据以下简历信息，将候选人归类到最合适的业务线，并给出置信度（0-100的整数）。
只返回JSON，格式：{{"category": "业务线名称", "confidence": 85, "reason": "简短原因"}}

业务线选项：制造、研发、行政、后勤、销售、其他

职位：{title}
技能：{skills}
公司：{companies}"""
            }
        ],
    )
    
    try:
        raw = message.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        return json.loads(raw)
    except:
        return {"category": "其他", "confidence": 50, "reason": "自动分类"}


# ==================== API Endpoints ====================

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Resume System API"}


@app.post("/api/parse-resumes")
async def parse_resumes(files: List[UploadFile] = File(...)):
    """Batch parse multiple resumes"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="最多支持10份简历同时上传")
    
    results = []
    for file in files:
        try:
            content = await file.read()
            file_type = file.content_type or ""
            
            if file_type in ["image/jpeg", "image/png", "image/jpg"]:
                b64_content = base64.standard_b64encode(content).decode("utf-8")
                parsed = await parse_resume_with_claude(b64_content, file_type, file.filename)
            elif "pdf" in file_type:
                # For PDF, extract text (simplified - treat as text)
                text = content.decode("latin-1", errors="ignore")
                parsed = await parse_resume_with_claude(text[:3000], "text", file.filename)
            elif "word" in file_type or file.filename.endswith(".docx"):
                text = extract_text_from_docx(content)
                parsed = await parse_resume_with_claude(text[:3000], "text", file.filename)
            else:
                # Try as plain text
                text = content.decode("utf-8", errors="ignore")
                parsed = await parse_resume_with_claude(text[:3000], "text", file.filename)
            
            # Auto classify
            classification = await classify_resume(parsed)
            parsed["classification"] = classification
            parsed["id"] = f"resume_{len(results)+1}_{file.filename[:10]}"
            results.append(parsed)
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e),
                "name": "解析失败",
                "id": f"error_{len(results)+1}"
            })
    
    return {"resumes": results, "total": len(results)}


class MatchByJDRequest(BaseModel):
    jd_text: str
    resumes: list


@app.post("/api/match-by-jd")
async def match_by_jd(request: MatchByJDRequest):
    """Match candidates by Job Description"""
    if not request.resumes:
        raise HTTPException(status_code=400, detail="请先上传简历")
    
    resume_summaries = []
    for i, r in enumerate(request.resumes):
        resume_summaries.append(f"""
候选人{i+1}（ID: {r.get('id', i)}）:
- 姓名: {r.get('name', '未知')}
- 职位: {r.get('current_title', '未知')}
- 技能: {', '.join(r.get('skills', []))}
- 工作年限: {r.get('work_years', '未知')}年
- 学历: {r.get('education', '未知')}
""")
    
    message = client.chat.completions.create(
        model=TEXT_MODEL,
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": f"""根据以下JD和候选人信息，为每位候选人打分并排序。
只返回JSON数组，格式：
[{{"id": "候选人ID", "name": "姓名", "total_score": 85, "skill_score": 90, "exp_score": 80, "edu_score": 85, "reason": "匹配原因简述"}}]
按total_score从高到低排序。

JD内容：
{request.jd_text}

候选人列表：
{''.join(resume_summaries)}"""
            }
        ],
    )
    
    try:
        raw = message.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        rankings = json.loads(raw)
        return {"rankings": rankings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"匹配失败: {str(e)}")


class MatchByResumeRequest(BaseModel):
    resume: dict


@app.post("/api/match-by-resume")
async def match_by_resume(request: MatchByResumeRequest):
    """Match jobs by resume"""
    r = request.resume
    
    jobs_text = "\n".join([
        f"岗位{j['id']}: {j['title']}（{j['dept']}）- 要求：{j['requirements']}"
        for j in SAMPLE_JOBS
    ])
    
    message = client.chat.completions.create(
        model=TEXT_MODEL,
        max_tokens=1000,
        messages=[
            {
                "role": "user",
                "content": f"""根据候选人简历，从岗位列表中推荐最匹配的Top3岗位。
只返回JSON数组，格式：
[{{"job_id": "1", "title": "职位名", "dept": "部门", "match_score": 92, "reason": "推荐理由"}}]

候选人信息：
- 职位：{r.get('current_title', '未知')}
- 技能：{', '.join(r.get('skills', []))}
- 工作年限：{r.get('work_years', '未知')}年
- 学历：{r.get('education', '未知')}

可选岗位：
{jobs_text}"""
            }
        ],
    )
    
    try:
        raw = message.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        jobs = json.loads(raw)
        return {"recommended_jobs": jobs[:3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"匹配失败: {str(e)}")


class GenerateResumeRequest(BaseModel):
    name: str
    age: str
    gender: str
    phone: str
    job_type: str
    work_years: str
    health_status: str
    work_experience: str
    skills: Optional[str] = ""


@app.post("/api/generate-resume")
async def generate_resume(request: GenerateResumeRequest):
    """Generate resume for elderly/manual workers"""
    message = client.chat.completions.create(
        model=TEXT_MODEL,
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": f"""请根据以下信息，生成一份规范、专业的简历文本。使用中文，格式清晰，适合打印。

个人信息：
- 姓名：{request.name}
- 年龄：{request.age}
- 性别：{request.gender}
- 联系电话：{request.phone}
- 意向岗位：{request.job_type}

工作经历：
- 从事工作年限：{request.work_years}年
- 工作经历描述：{request.work_experience}

技能特长：{request.skills or '体力充沛，吃苦耐劳'}
健康状况：{request.health_status}

请生成完整简历文本，包含：个人基本信息、工作意向、工作经历、技能特长、健康状况声明。
用清晰的分节格式，语言朴实真诚。"""
            }
        ],
    )
    
    resume_text = message.choices[0].message.content
    return {"resume_text": resume_text}


class TranslateResumeRequest(BaseModel):
    resume_text: str
    detected_language: Optional[str] = None


@app.post("/api/translate-resume")
async def translate_resume(request: TranslateResumeRequest):
    """Translate and summarize foreign language resume"""
    message = client.chat.completions.create(
        model=TEXT_MODEL,
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": f"""请分析以下简历，完成：
1. 识别语言
2. 提取关键信息（结构化JSON）
3. 生成200字以内中文摘要，方便国内HR快速了解

只返回JSON，格式：
{{
  "detected_language": "语言名称",
  "name": "姓名",
  "current_title": "当前职位",
  "education": "学历",
  "school": "院校（注明国家/地区）",
  "work_years": "工作年限",
  "skills": ["技能列表"],
  "school_tier": "院校层次评估（如：英国G5名校/美国TOP50等）",
  "title_context": "职级说明（如：相当于国内高级经理级别）",
  "chinese_summary": "200字以内中文摘要"
}}

简历内容：
{request.resume_text[:3000]}"""
            }
        ],
    )
    
    try:
        raw = message.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        return json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"翻译失败: {str(e)}")


@app.get("/api/jobs")
async def get_jobs():
    """Get available job positions"""
    return {"jobs": SAMPLE_JOBS}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "model": TEXT_MODEL}
