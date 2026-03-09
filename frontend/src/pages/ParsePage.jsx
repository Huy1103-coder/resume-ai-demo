import { useState, useRef } from 'react'
import axios from 'axios'
import { PageHeader, StatusBadge, CategoryTag, ScoreBar, Spinner, EmptyState, InfoRow } from '../components/UI'

const API = import.meta.env.VITE_API_URL || ''

export default function ParsePage({ onResumesUpdate, resumes }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showRawPhone, setShowRawPhone] = useState({})
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef()

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      const ext = f.name.toLowerCase()
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc')
        || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.txt')
    })
    setFiles(prev => [...prev, ...valid].slice(0, 10))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleParse = async () => {
    if (!files.length) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('files', f))
      const res = await axios.post(`${API}/api/parse-resumes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onResumesUpdate(res.data.resumes)
      setFiles([])
    } catch (err) {
      setError(err.response?.data?.detail || '解析失败，请检查 API Key 配置')
    } finally {
      setLoading(false)
    }
  }

  const togglePhone = (id) => {
    setShowRawPhone(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader
        icon="⬡"
        title="批量简历解析"
        subtitle="支持 PDF · Word · JPG · PNG · TXT，最多10份并发"
        badge="MODULE 01"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: upload + list */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
          {/* Upload zone */}
          <div className="p-4">
            <div
              className={`upload-zone p-6 text-center ${dragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="font-mono text-2xl text-muted mb-2">⬡</div>
              <div className="font-body text-xs text-text-dim mb-1">拖拽或点击上传简历</div>
              <div className="font-mono text-xs text-muted">PDF · DOCX · JPG · PNG</div>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-sm">
                    <span className="font-mono text-xs text-accent w-4 text-center">{i+1}</span>
                    <span className="font-body text-xs text-text truncate flex-1">{f.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, idx) => idx !== i)) }}
                      className="font-mono text-xs text-text-dim hover:text-danger w-4 text-center"
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={handleParse}
                  disabled={loading}
                  className="accent-btn w-full mt-3 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : `▶ 开始解析 (${files.length}份)`}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 px-3 py-2 border border-danger border-opacity-30 bg-danger bg-opacity-5 rounded-sm">
                <div className="font-mono text-xs text-danger">{error}</div>
              </div>
            )}
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {resumes.length > 0 && (
              <div className="space-y-2">
                <div className="font-mono text-xs text-text-dim mb-3 flex items-center justify-between">
                  <span>已解析 · {resumes.length} 份</span>
                  <button
                    onClick={() => { onResumesUpdate([]); setSelected(null) }}
                    className="text-danger hover:opacity-100 opacity-60"
                  >清空</button>
                </div>
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`panel-card p-3 cursor-pointer ${selected?.id === r.id ? 'border-accent border-opacity-40' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="font-body text-sm font-500 text-text">{r.name || '未知'}</div>
                        <div className="font-mono text-xs text-text-dim mt-0.5">{r.current_title || '职位未知'}</div>
                      </div>
                      {r.classification && (
                        <CategoryTag category={r.classification.category} />
                      )}
                    </div>
                    {r.classification && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="font-mono text-xs text-text-dim">匹配度</span>
                          <span className="font-mono text-xs text-accent">{r.classification.confidence}%</span>
                        </div>
                        <ScoreBar score={r.classification.confidence} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <div className="max-w-2xl animate-slide-up">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display font-700 text-2xl text-text">{selected.name}</h2>
                  <div className="font-mono text-sm text-text-dim mt-1">{selected.current_title}</div>
                  {selected.classification && (
                    <div className="flex items-center gap-2 mt-2">
                      <CategoryTag category={selected.classification.category} />
                      <span className="font-mono text-xs text-text-dim">{selected.classification.reason}</span>
                    </div>
                  )}
                </div>
                <div className="font-mono text-xs text-text-dim border border-border px-3 py-2 rounded-sm text-right">
                  <div className="text-accent text-base font-700">{selected.classification?.confidence || '--'}%</div>
                  <div className="opacity-60 mt-0.5">分类置信度</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3 uppercase tracking-wider">基本信息</div>
                  <InfoRow label="年龄" value={selected.age ? `${selected.age}岁` : null} />
                  <InfoRow label="工龄" value={selected.work_years ? `${selected.work_years}年` : null} />
                  <InfoRow label="学历" value={selected.education} />
                  <InfoRow label="院校" value={selected.school} />
                  <InfoRow label="语言" value={selected.language} mono />
                </div>
                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3 uppercase tracking-wider">联系方式</div>
                  <div className="py-1.5 border-b border-border border-opacity-50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-text-dim">手机</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text">
                          {showRawPhone[selected.id] ? selected.phone_raw : selected.phone}
                        </span>
                        {selected.phone && (
                          <button
                            onClick={() => togglePhone(selected.id)}
                            className="font-mono text-xs text-accent hover:opacity-80"
                          >
                            {showRawPhone[selected.id] ? '隐藏' : '显示'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <InfoRow label="邮箱" value={selected.email} />
                  <div className="mt-3 px-2 py-1.5 bg-success bg-opacity-5 border border-success border-opacity-20 rounded-sm">
                    <div className="font-mono text-xs text-success">✓ 数据已脱敏处理</div>
                  </div>
                </div>
              </div>

              {selected.skills?.length > 0 && (
                <div className="panel-card p-4 mb-4">
                  <div className="font-mono text-xs text-text-dim mb-3 uppercase tracking-wider">技能关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.map((s, i) => (
                      <span key={i} className="font-mono text-xs px-2 py-1 bg-surface border border-border rounded-sm text-text-dim">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.companies?.length > 0 && (
                <div className="panel-card p-4 mb-4">
                  <div className="font-mono text-xs text-text-dim mb-3 uppercase tracking-wider">过往企业</div>
                  <div className="space-y-1">
                    {selected.companies.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted w-4">{i+1}.</span>
                        <span className="font-body text-sm text-text">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.summary && (
                <div className="panel-card p-4">
                  <div className="font-mono text-xs text-text-dim mb-3 uppercase tracking-wider">AI 摘要</div>
                  <p className="font-body text-sm text-text leading-relaxed">{selected.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon="◈"
              message="点击左侧简历查看详情"
              sub="解析完成后可在此查看提取结果"
            />
          )}
        </div>
      </div>
    </div>
  )
}
