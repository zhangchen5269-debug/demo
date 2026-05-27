import { motion } from 'framer-motion'
import { Search, Sparkles, Loader2, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  isSearching?: boolean
  searchMode?: 'keyword' | 'ai'
  onModeChange?: (mode: 'keyword' | 'ai') => void
}

export default function SearchBar({ 
  value, 
  onChange, 
  isSearching = false,
  searchMode = 'keyword',
  onModeChange 
}: SearchBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
    >
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-primary" />
            </motion.div>
          ) : (
            <Search className="w-5 h-5 text-neutral-500" />
          )}
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索失物名称、地点或描述..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-24 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
        />
        
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className="absolute right-24 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </motion.button>
        )}
        
        {onModeChange && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onModeChange(searchMode === 'keyword' ? 'ai' : 'keyword')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              searchMode === 'ai'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </motion.button>
        )}
      </div>
      
      {value && searchMode === 'ai' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-xs text-gray-500 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>AI 语义匹配模式 - 正在分析语义相关性...</span>
        </motion.div>
      )}
    </motion.div>
  )
}
