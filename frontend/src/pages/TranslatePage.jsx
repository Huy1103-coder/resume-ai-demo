import { useState } from 'react'
import axios from 'axios'
import { PageHeader, Spinner, InfoRow } from '../components/UI'

const API = import.meta.env.VITE_API_URL || ''

const SAMPLE_EN = `John Smith
Senior Software Engineer | john.smith@email.com | +1-555-0123

EDUCATION
University of Oxford, MSc Computer Science, 2015
First Class Honours

EXPERIENCE
Google LLC, Senior Software Engineer (L6), 2019-Present
- Led architecture of distributed data pipeline processing 10B+ events/day
- Managed cross-functional team of 8 engineers across 3 time zones

Amazon Web Services, Software Engineer II, 2015-2019
- Core contributor to Aurora DB replication engine

SKILLS
Python, Java, Go, Kubernetes, Distributed Systems, ML Ops`

const LANG_COLORS = {
  '英文': 'text-blue-400',
  '日文': 'text-red-400',
  '德文': 'text-yellow-400',
  '中文': 'text-accent',
  '法文': 'text-purple-400',
}

export default function TranslatePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleTranslate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/api/translate-resume`, { resume_text: text })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || '解析失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader
        icon="⬨"
        title="多语言简历解析"
        subtitle="英 · 日 · 德 · 法文简历自动解析 + 中文摘要 + 院校职级评估"
        badge="MODULE 05"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Input */}
        <div className="w-96 flex-shrink-0 border-r border-border flex flex-col p-5 gap-4">
          <div>
            <div className="font-mono text-xs text-text-dim mb-2 flex items-center justify-between">
              <span>简历原文</span>
              <button onClick={() => setText(SAMPLE_EN)} className="text-accent text-xs hover:opacity-80">
                英文示例
              </button>
            </div>
            <textarea
              className="input-field h-72 resize-none leading-relaxed text-xs"
              placeholder="粘贴英文/日文/德文/法文简历原文..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          <div className="panel-card p-3 space-y-1.5">
            <div className="font-mono text-xs text-text-dim mb-2">支持语言</div>
            {['英文', '日文', '德文', '法文', '其他'].map(lang => (
              <div key={lang} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${LANG_COLORS[lang] ? 'bg-current' : 'bg-muted'} ${LANG_COLORS[lang] || ''}`}></div>
                <span className="font-mono text-xs text-text-dim">{lang}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-3 py-2 border border-danger border-opacity-30 bg-danger bg-opacity-5 rounded-sm">
              <div className="font-mono text-xs text-danger">{error}</div>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="accent-btn flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : '▶ 解析 & 生成摘要'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {result ? (
            <div className="max-w-2xl animate-slide-up space-y-4">
              {/* Language tag + name */}
              <div className="flex items-center gap-3 mb-2">
                <span className={`font-mono text-sm font-700 ${LANG_COLORS[result.detected_language] || 'text-text-dim'}`}>
                  {result.detected_language}
                </span>
                <div className="h-px flex-1 bg-border"></div>
                <span className="font-body text-lg font-500 text-text">{result.name}</span>
              </div>

              {/* Key info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3">基本信息</div>
                  <InfoRow label="当前职位" value={result.current_title} />
                  <InfoRow label="工作年限" value={result.work_years} />
                  <InfoRow label="学历" value={result.education} />
                  <InfoRow label="毕业院校" value={result.school} />
                </div>

                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3">跨文化评估</div>
                  {result.school_tier && (
                    <div className="mb-3 px-3 py-2 bg-accent bg-opacity-5 border border-accent border-opacity-20 rounded-sm">
                      <div className="font-mono text-xs text-text-dim mb-0.5">院校层次</div>
                      <div className="font-body text-xs text-accent">{result.school_tier}</div>
                    </div>
                  )}
                  {result.title_context && (
                    <div className="px-3 py-2 bg-success bg-opacity-5 border border-success border-opacity-20 rounded-sm">
                      <div className="font-mono text-xs text-text-dim mb-0.5">职级说明</div>
                      <div className="font-body text-xs text-success">{result.title_context}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {result.skills?.length > 0 && (
                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3">技能关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {result.skills.map((s, i) => (
                      <span key={i} className="font-mono text-xs px-2 py-1 bg-surface border border-border rounded-sm text-text-dim">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chinese summary - main feature */}
              {result.chinese_summary && (
                <div className="panel-card p-5 border-accent border-opacity-30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs text-accent">中文摘要</span>
                    <div className="h-px flex-1 bg-accent opacity-20"></div>
                    <span className="font-mono text-xs text-text-dim">供 HR 快速评估</span>
                  </div>
                  <p className="font-body text-sm text-text leading-relaxed">{result.chinese_summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="font-mono text-4xl text-muted mb-4">⬨</div>
              <div className="font-body text-sm text-text-dim mb-1">粘贴海外简历原文</div>
              <div className="font-mono text-xs text-muted">AI 自动识别语言 · 生成中文摘要</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
