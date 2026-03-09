import { useState } from 'react'
import axios from 'axios'
import { PageHeader, ScoreBar, Spinner, EmptyState } from '../components/UI'

const API = import.meta.env.VITE_API_URL || ''

const SAMPLE_JD = `职位：高级Java工程师
部门：研发中心

岗位职责：
1. 负责核心业务系统的架构设计与开发
2. 主导技术方案评审，解决复杂技术问题
3. 带领团队完成项目交付，3-5人团队管理

任职要求：
1. 本科及以上学历，计算机相关专业
2. 5年以上Java开发经验，熟悉Spring Boot/Cloud
3. 熟悉MySQL、Redis、消息队列等中间件
4. 有大型项目架构经验者优先
5. 具备良好沟通能力和团队协作精神`

export default function MatchJDPage({ resumes }) {
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [rankings, setRankings] = useState([])
  const [error, setError] = useState(null)

  const handleMatch = async () => {
    if (!jd.trim() || !resumes.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/api/match-by-jd`, {
        jd_text: jd,
        resumes: resumes
      })
      setRankings(res.data.rankings)
    } catch (err) {
      setError(err.response?.data?.detail || '匹配失败')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warn'
    return 'text-danger'
  }

  const getRank = (i) => {
    if (i === 0) return { label: '01', color: 'text-accent border-accent border-opacity-40 bg-accent bg-opacity-5' }
    if (i === 1) return { label: '02', color: 'text-text-dim border-border' }
    if (i === 2) return { label: '03', color: 'text-text-dim border-border' }
    return { label: `0${i+1}`, color: 'text-muted border-border border-opacity-50' }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader
        icon="◈"
        title="岗适其人 · JD 匹配"
        subtitle="输入职位描述，AI 自动从人才库按匹配度排序"
        badge="MODULE 02"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* JD input */}
        <div className="w-96 flex-shrink-0 border-r border-border flex flex-col p-5 gap-4">
          <div>
            <div className="font-mono text-xs text-text-dim mb-2 flex items-center justify-between">
              <span>JD · 职位描述</span>
              <button
                onClick={() => setJd(SAMPLE_JD)}
                className="text-accent hover:opacity-80 text-xs"
              >载入示例</button>
            </div>
            <textarea
              className="input-field h-64 resize-none leading-relaxed"
              placeholder="粘贴 JD 内容，包括职责要求、技能要求等..."
              value={jd}
              onChange={e => setJd(e.target.value)}
            />
          </div>

          <div className="panel-card p-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs text-text-dim">可用简历</div>
              <div className="font-display text-xl font-700 text-accent">{resumes.length}</div>
            </div>
            {resumes.length === 0 && (
              <div className="font-mono text-xs text-warn">请先在模块01解析简历</div>
            )}
          </div>

          {error && (
            <div className="px-3 py-2 border border-danger border-opacity-30 bg-danger bg-opacity-5 rounded-sm">
              <div className="font-mono text-xs text-danger">{error}</div>
            </div>
          )}

          <button
            onClick={handleMatch}
            disabled={loading || !jd.trim() || !resumes.length}
            className="accent-btn flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : '▶ 开始智能匹配'}
          </button>
        </div>

        {/* Rankings */}
        <div className="flex-1 overflow-y-auto p-6">
          {rankings.length > 0 ? (
            <div className="max-w-2xl animate-slide-up">
              <div className="font-mono text-xs text-text-dim mb-4 flex items-center gap-3">
                <span>匹配结果 · {rankings.length} 位候选人</span>
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-accent">按匹配度排序</span>
              </div>

              <div className="space-y-3">
                {rankings.map((r, i) => {
                  const rank = getRank(i)
                  return (
                    <div key={r.id || i} className="panel-card p-4 animate-slide-up" style={{animationDelay: `${i * 80}ms`}}>
                      <div className="flex items-start gap-4">
                        <div className={`font-mono text-xs border px-2 py-1 rounded-sm flex-shrink-0 ${rank.color}`}>
                          {rank.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-body font-500 text-sm text-text">{r.name}</div>
                              <div className="font-mono text-xs text-text-dim mt-0.5">{r.reason}</div>
                            </div>
                            <div className={`font-display text-2xl font-700 ${getScoreColor(r.total_score)} flex-shrink-0 ml-3`}>
                              {r.total_score}
                            </div>
                          </div>

                          {/* Score breakdown */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: '技能匹配', score: r.skill_score },
                              { label: '经验匹配', score: r.exp_score },
                              { label: '学历匹配', score: r.edu_score },
                            ].map(({ label, score }) => (
                              <div key={label}>
                                <div className="flex justify-between mb-1">
                                  <span className="font-mono text-xs text-text-dim">{label}</span>
                                  <span className="font-mono text-xs text-text">{score || '--'}</span>
                                </div>
                                <ScoreBar score={score || 0} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="◈"
              message="输入 JD 后点击匹配"
              sub={resumes.length === 0 ? "请先在模块01上传并解析简历" : `人才库中有 ${resumes.length} 份简历可供匹配`}
            />
          )}
        </div>
      </div>
    </div>
  )
}
