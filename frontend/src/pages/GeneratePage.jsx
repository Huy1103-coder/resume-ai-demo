import { useState } from 'react'
import axios from 'axios'
import { PageHeader, Spinner } from '../components/UI'

const API = import.meta.env.VITE_API_URL || ''

const STEPS = [
  { key: 'name', label: '您叫什么名字？', placeholder: '请输入姓名', type: 'text' },
  { key: 'age', label: '您今年多少岁？', placeholder: '例如：45', type: 'text' },
  { key: 'gender', label: '您的性别？', placeholder: '男 / 女', type: 'text' },
  { key: 'phone', label: '联系电话是多少？', placeholder: '手机号码', type: 'tel' },
  { key: 'job_type', label: '想做什么工作？', placeholder: '例如：保安、保洁、搬运工', type: 'text' },
  { key: 'work_years', label: '从事该工作多少年了？', placeholder: '例如：10', type: 'text' },
  { key: 'health_status', label: '身体状况如何？', placeholder: '例如：身体健康，无慢性病，体力充沛', type: 'text' },
  { key: 'work_experience', label: '简单说说您的工作经历', placeholder: '在哪里做过什么工作...', type: 'textarea' },
  { key: 'skills', label: '您有什么特长或技能？（可不填）', placeholder: '例如：会开叉车，有电工证', type: 'text', optional: true },
]

export default function GeneratePage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentInput, setCurrentInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  const handleNext = async () => {
    if (!currentInput.trim() && !currentStep.optional) return

    const newAnswers = { ...answers, [currentStep.key]: currentInput }
    setAnswers(newAnswers)
    setCurrentInput('')

    if (isLastStep) {
      await generateResume(newAnswers)
    } else {
      setStep(s => s + 1)
    }
  }

  const generateResume = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/api/generate-resume`, data)
      setResult(res.data.resume_text)
    } catch (err) {
      setError(err.response?.data?.detail || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setCurrentInput('')
    setResult(null)
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && currentStep.type !== 'textarea') {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <PageHeader
        icon="◎"
        title="简历生成器"
        subtitle="针对大龄/劳务员工 · 对话式信息收集 · 自动生成规范简历"
        badge="MODULE 04"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat interface */}
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-6">
          {!result ? (
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < step ? 'bg-accent' : i === step ? 'bg-accent opacity-50' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <div className="font-mono text-xs text-text-dim mb-4">
                步骤 {step + 1} / {STEPS.length}
              </div>

              {/* Previous answers */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                {STEPS.slice(0, step).map((s, i) => (
                  <div key={s.key} className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 border border-accent border-opacity-40 rounded-full flex items-center justify-center">
                        <span className="font-mono text-xs text-accent">AI</span>
                      </div>
                      <span className="font-body text-sm text-text-dim">{s.label}</span>
                    </div>
                    <div className="ml-8 px-3 py-2 bg-surface border border-border rounded-sm inline-block">
                      <span className="font-body text-sm text-text">{answers[s.key] || '（跳过）'}</span>
                    </div>
                  </div>
                ))}

                {/* Current question */}
                {!loading && (
                  <div className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 border border-accent rounded-full flex items-center justify-center bg-accent bg-opacity-10">
                        <span className="font-mono text-xs text-accent">AI</span>
                      </div>
                      <span className="font-body text-base text-text font-500">{currentStep.label}</span>
                      {currentStep.optional && (
                        <span className="font-mono text-xs text-muted">（选填）</span>
                      )}
                    </div>

                    <div className="ml-8">
                      {currentStep.type === 'textarea' ? (
                        <textarea
                          autoFocus
                          className="input-field h-24 resize-none text-base leading-relaxed"
                          placeholder={currentStep.placeholder}
                          value={currentInput}
                          onChange={e => setCurrentInput(e.target.value)}
                        />
                      ) : (
                        <input
                          autoFocus
                          type={currentStep.type}
                          className="input-field text-base"
                          placeholder={currentStep.placeholder}
                          value={currentInput}
                          onChange={e => setCurrentInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={handleNext}
                          disabled={!currentInput.trim() && !currentStep.optional}
                          className="accent-btn"
                        >
                          {isLastStep ? '▶ 生成简历' : '下一步 →'}
                        </button>
                        {currentStep.optional && (
                          <button
                            onClick={() => { setCurrentInput(''); handleNext() }}
                            className="font-mono text-xs text-text-dim hover:text-text"
                          >
                            跳过此项
                          </button>
                        )}
                        {step > 0 && (
                          <button
                            onClick={() => { setStep(s => s - 1); setCurrentInput(answers[STEPS[step-1].key] || '') }}
                            className="font-mono text-xs text-text-dim hover:text-text ml-auto"
                          >
                            ← 上一步
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-3 py-8">
                    <Spinner />
                    <span className="font-body text-sm text-text-dim">AI 正在生成规范简历...</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 border border-danger border-opacity-30 bg-danger bg-opacity-5 rounded-sm">
                  <div className="font-mono text-xs text-danger">{error}</div>
                </div>
              )}
            </>
          ) : (
            /* Result */
            <div className="flex-1 overflow-y-auto animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse-slow"></div>
                  <span className="font-mono text-xs text-success">简历生成成功</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="font-mono text-xs text-accent hover:opacity-80"
                  >
                    复制文本
                  </button>
                  <button onClick={handleReset} className="font-mono text-xs text-text-dim hover:text-text">
                    重新生成
                  </button>
                </div>
              </div>

              <div className="panel-card p-6">
                <pre className="font-body text-sm text-text leading-relaxed whitespace-pre-wrap">{result}</pre>
              </div>

              <div className="mt-4 px-4 py-3 border border-success border-opacity-20 bg-success bg-opacity-5 rounded-sm">
                <div className="font-mono text-xs text-success mb-1">✓ 完成</div>
                <div className="font-body text-xs text-text-dim">简历已生成，可复制后交由打印店打印，或发送给用人单位。</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
