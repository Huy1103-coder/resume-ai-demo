import { useState } from 'react'
import axios from 'axios'
import { PageHeader, CategoryTag, ScoreBar, Spinner, EmptyState } from '../components/UI'

const API = import.meta.env.VITE_API_URL || ''

const DEPT_COLORS = {
  '研发': 'text-accent',
  '制造': 'text-warn',
  '行政': 'text-purple-400',
  '后勤': 'text-yellow-400',
  '销售': 'text-success',
}

export default function MatchResumePage({ resumes }) {
  const [selectedResume, setSelectedResume] = useState(null)
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)

  const handleMatch = async () => {
    if (!selectedResume) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/api/match-by-resume`, {
        resume: selectedResume
      })
      setJobs(res.data.recommended_jobs)
    } catch (err) {
      setError(err.response?.data?.detail || '匹配失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader
        icon="◇"
        title="人适其岗 · 简历推荐岗位"
        subtitle="选择一份简历，AI 自动从岗位库推荐 Top 3 最匹配职位"
        badge="MODULE 03"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Resume selector */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col p-4">
          <div className="font-mono text-xs text-text-dim mb-3">选择候选人 · {resumes.length} 份</div>

          {resumes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-3xl text-muted mb-2">◇</div>
                <div className="font-body text-xs text-text-dim">请先解析简历</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {resumes.map(r => (
                <div
                  key={r.id}
                  onClick={() => { setSelectedResume(r); setJobs([]) }}
                  className={`panel-card p-3 cursor-pointer ${selectedResume?.id === r.id ? 'border-accent border-opacity-40' : ''}`}
                >
                  <div className="font-body text-sm font-500 text-text">{r.name}</div>
                  <div className="font-mono text-xs text-text-dim mt-0.5">{r.current_title || '职位未知'}</div>
                  {r.classification && (
                    <div className="mt-1.5">
                      <CategoryTag category={r.classification.category} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-3 px-3 py-2 border border-danger border-opacity-30 bg-danger bg-opacity-5 rounded-sm">
              <div className="font-mono text-xs text-danger">{error}</div>
            </div>
          )}

          <button
            onClick={handleMatch}
            disabled={loading || !selectedResume}
            className="accent-btn flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : '▶ 推荐匹配岗位'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedResume && (
            <div className="max-w-2xl">
              {/* Selected resume summary */}
              <div className="panel-card p-4 mb-6">
                <div className="font-mono text-xs text-text-dim mb-2">候选人档案</div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-border flex items-center justify-center bg-surface flex-shrink-0 font-display font-700 text-accent">
                    {selectedResume.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-body font-500 text-text">{selectedResume.name}</div>
                    <div className="font-mono text-xs text-text-dim mt-0.5">{selectedResume.current_title}</div>
                    {selectedResume.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedResume.skills.slice(0, 5).map((s, i) => (
                          <span key={i} className="font-mono text-xs px-1.5 py-0.5 bg-surface border border-border rounded-sm text-text-dim">
                            {s}
                          </span>
                        ))}
                        {selectedResume.skills.length > 5 && (
                          <span className="font-mono text-xs text-muted">+{selectedResume.skills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {jobs.length > 0 ? (
                <div className="animate-slide-up">
                  <div className="font-mono text-xs text-text-dim mb-4 flex items-center gap-3">
                    <span>推荐岗位 Top {jobs.length}</span>
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-accent">按匹配度排序</span>
                  </div>

                  <div className="space-y-4">
                    {jobs.map((job, i) => (
                      <div key={job.job_id || i} className="panel-card p-5 animate-slide-up" style={{animationDelay: `${i * 100}ms`}}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted">#{i+1}</span>
                              <span className="font-body font-500 text-base text-text">{job.title}</span>
                            </div>
                            <div className={`font-mono text-xs ${DEPT_COLORS[job.dept] || 'text-text-dim'}`}>
                              {job.dept} 部门
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-3xl font-700 text-accent">{job.match_score}</div>
                            <div className="font-mono text-xs text-text-dim">匹配度</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <ScoreBar score={job.match_score} color="success" />
                        </div>

                        <div className="px-3 py-2 bg-surface border-l-2 border-accent border-opacity-40 rounded-sm">
                          <div className="font-mono text-xs text-text-dim mb-1">推荐理由</div>
                          <div className="font-body text-xs text-text leading-relaxed">{job.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : !loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="font-mono text-3xl text-muted mb-3">◇</div>
                  <div className="font-body text-sm text-text-dim">点击左侧按钮开始推荐</div>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              )}
            </div>
          )}

          {!selectedResume && (
            <EmptyState
              icon="◇"
              message="从左侧选择一位候选人"
              sub={resumes.length === 0 ? "请先在模块01解析简历" : "AI 将为其推荐最匹配的集团岗位"}
            />
          )}
        </div>
      </div>
    </div>
  )
}
