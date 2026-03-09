import { useState } from 'react'
import ParsePage from './pages/ParsePage'
import MatchJDPage from './pages/MatchJDPage'
import MatchResumePage from './pages/MatchResumePage'
import GeneratePage from './pages/GeneratePage'
import TranslatePage from './pages/TranslatePage'

const NAV_ITEMS = [
  { id: 'parse', icon: '⬡', label: '批量简历解析', sublabel: 'Multi-Resume Parser' },
  { id: 'match-jd', icon: '◈', label: '岗适其人匹配', sublabel: 'JD → Candidates' },
  { id: 'match-resume', icon: '◇', label: '人适其岗推荐', sublabel: 'Resume → Jobs' },
  { id: 'generate', icon: '◎', label: '简历生成器', sublabel: 'Resume Generator' },
  { id: 'translate', icon: '⬨', label: '多语言解析', sublabel: 'Multilingual' },
]

export default function App() {
  const [activePage, setActivePage] = useState('parse')
  const [globalResumes, setGlobalResumes] = useState([])

  const renderPage = () => {
    switch(activePage) {
      case 'parse': return <ParsePage onResumesUpdate={setGlobalResumes} resumes={globalResumes} />
      case 'match-jd': return <MatchJDPage resumes={globalResumes} />
      case 'match-resume': return <MatchResumePage resumes={globalResumes} />
      case 'generate': return <GeneratePage />
      case 'translate': return <TranslatePage />
      default: return <ParsePage onResumesUpdate={setGlobalResumes} resumes={globalResumes} />
    }
  }

  return (
    <div className="flex h-screen bg-void overflow-hidden grid-bg">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-panel border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 border border-accent flex items-center justify-center" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
              <div className="w-3 h-3 bg-accent" style={{clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}></div>
            </div>
            <div>
              <div className="font-display font-700 text-sm text-accent tracking-wider">RESUME AI</div>
              <div className="font-mono text-xs text-text-dim tracking-widest">SYSTEM v1.0</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-text-dim font-body">AI简历智能管理系统 · Demo</div>
        </div>

        {/* Status indicator */}
        <div className="mx-4 my-3 px-3 py-2 bg-surface border border-border rounded-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow"></div>
          <span className="font-mono text-xs text-success">glm-4-flash 在线</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-item w-full text-left ${activePage === item.id ? 'active' : ''}`}
            >
              <span className="font-mono text-base leading-none w-5 text-center flex-shrink-0">{item.icon}</span>
              <div>
                <div className="font-body text-xs font-500">{item.label}</div>
                <div className="font-mono text-xs opacity-50 mt-0.5">{item.sublabel}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Resume count badge */}
        {globalResumes.length > 0 && (
          <div className="mx-4 mb-4 px-3 py-2 bg-surface border border-accent border-opacity-20 rounded-sm">
            <div className="font-mono text-xs text-text-dim">已解析简历</div>
            <div className="font-display text-2xl font-700 text-accent">{globalResumes.length}</div>
            <div className="font-mono text-xs text-text-dim">份 · 可用于匹配</div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="font-mono text-xs text-text-dim text-center">
            Powered by 智谱 GLM
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}
