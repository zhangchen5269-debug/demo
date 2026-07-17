import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Loader2, X, Image as ImageIcon, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react'
import { AIStatus } from '../utils/api'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  isSearching?: boolean
  searchMode?: 'keyword' | 'ai'
  onModeChange?: (mode: 'keyword' | 'ai') => void
  onImageSearch?: () => void
  aiStatus?: AIStatus
}

export default function SearchBar({
  value,
  onChange,
  isSearching = false,
  searchMode = 'keyword',
  onModeChange,
  onImageSearch,
  aiStatus = 'checking',
}: SearchBarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭 tooltip
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }
    if (showTooltip) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [showTooltip])

  const statusConfig: Record<AIStatus, { dot: string; icon: JSX.Element; label: string; desc: string }> = {
    online: {
      dot: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      label: 'AI 就绪',
      desc: '语义搜索和智能识别可用',
    },
    degraded: {
      dot: 'bg-amber-400',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
      label: 'AI 密钥过期',
      desc: '语义搜索不可用，已切换关键词模式',
    },
    offline: {
      dot: 'bg-slate-300',
      icon: <WifiOff className="w-3.5 h-3.5 text-slate-400" />,
      label: 'AI 离线',
      desc: '服务未连接，请检查网络或代理',
    },
    checking: {
      dot: 'bg-slate-300 animate-pulse',
      icon: <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />,
      label: '检测中...',
      desc: '正在检查 AI 服务状态',
    },
  }

  const status = statusConfig[aiStatus]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
    >
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            {isSearching ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-5 h-5 text-primary" />
              </motion.div>
            ) : (
              <Search className="w-5 h-5 text-ink-mute" />
            )}
          </div>
          
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="搜索失物名称、地点或描述..."
            className="w-full bg-canvas border border-hairline rounded-xl pl-12 pr-24 py-3.5 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onChange('')}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 hover:bg-canvas-soft rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-ink-mute" />
            </motion.button>
          )}
          
          {onModeChange && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* AI 状态指示器 */}
              {searchMode === 'ai' && (
                <div className="relative" ref={tooltipRef}>
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="flex items-center"
                    title={status.label}
                  >
                    <span className={`w-2 h-2 rounded-full ${status.dot} ring-2 ring-white`} />
                  </motion.button>
                  {showTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 right-0 w-48 bg-white border border-hairline rounded-xl shadow-soft-lg p-3 z-10"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {status.icon}
                        <span className="text-xs font-semibold text-ink">{status.label}</span>
                      </div>
                      <p className="text-xs text-ink-mute leading-relaxed">{status.desc}</p>
                    </motion.div>
                  )}
                </div>
              )}
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onModeChange(searchMode === 'keyword' ? 'ai' : 'keyword')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchMode === 'ai'
                    ? 'bg-gradient-to-r from-primary to-primary-deep text-ink shadow-soft'
                    : 'bg-canvas-soft text-ink-mute hover:bg-primary-bg-subdued'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI</span>
              </motion.button>
            </div>
          )}
        </div>

        {onImageSearch && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onImageSearch}
            className="px-4 py-3.5 bg-primary text-ink rounded-xl font-medium hover:bg-primary-deep transition-all shadow-soft flex items-center gap-2"
            title="AI 图片识别搜索"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="hidden sm:inline">图片识别</span>
          </motion.button>
        )}
      </div>
      
      {value && searchMode === 'ai' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-xs flex items-center gap-2"
        >
          {aiStatus === 'online' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-ink-mute">AI 语义匹配模式 — 正在分析语义相关性...</span>
            </>
          ) : aiStatus === 'degraded' ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">AI 密钥过期，已退回关键词搜索</span>
            </>
          ) : aiStatus === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">AI 服务未连接，使用关键词搜索</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              <span className="text-slate-500">正在连接 AI 服务...</span>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
