import { motion } from 'framer-motion'
import { MapPin, Calendar, CheckCircle2, Share2, Eye, Info, Sparkles } from 'lucide-react'
import { LostItem } from '../types/lostItem'

interface LostItemCardProps {
  item: LostItem
  index: number
  onFound?: () => void
  onShare?: () => void
  onDetail?: () => void
  isHighlighted?: boolean
}

const categoryConfig: Record<LostItem['category'], { color: string; bg: string; border: string }> = {
  '电子产品': {
    color: '#00B4D8',
    bg: 'rgba(0, 180, 216, 0.1)',
    border: 'rgba(0, 180, 216, 0.3)'
  },
  '证件卡片': {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)'
  },
  '书籍文具': {
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.3)'
  },
  '生活用品': {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)'
  },
  '其他': {
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.3)'
  }
}

export default function LostItemCard({ item, index, onFound, onShare, onDetail, isHighlighted = false }: LostItemCardProps) {
  const config = categoryConfig[item.category]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      className={`relative group ${isHighlighted ? 'z-10' : ''}`}
    >
      {isHighlighted && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0.5, 0.8, 0.5], scale: 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-2 rounded-[24px] bg-gradient-to-br from-primary via-secondary to-accent blur-xl"
          />
          <div className="absolute -top-3 left-4 z-20">
            <div className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 高匹配</span>
            </div>
          </div>
        </>
      )}
      
      <div className={`absolute -inset-[1px] rounded-[20px] bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500 ${isHighlighted ? '!opacity-100' : ''}`} />
      
      {/* Main card */}
      <div className="relative bg-white/70 backdrop-blur-xl rounded-[20px] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
        {/* Card content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 leading-tight mb-1 group-hover:text-primary transition-colors duration-300">
                {item.title}
              </h3>
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{ 
                  backgroundColor: config.bg, 
                  color: config.color,
                  borderColor: config.border
                }}
              >
                <Info className="w-3 h-3" />
                {item.category}
              </span>
            </div>
            
            {/* Status badge */}
            <div className="ml-4">
              {item.status === '待认领' ? (
                <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-100">
                  待认领
                </div>
              ) : (
                <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-100">
                  已认领
                </div>
              )}
            </div>
          </div>

          {/* Color badge */}
          {item.color && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full shadow-inner border-2 border-white/50"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 font-medium">{item.color}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-2">
            {item.description}
          </p>

          {/* Location & date */}
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-secondary" />
              <span>{item.date}</span>
            </div>
          </div>

          {/* Feature tags */}
          {item.features && item.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {item.features.map((feature, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 + idx * 0.03 }}
                  className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium border border-gray-100"
                >
                  {feature}
                </motion.span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFound}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-sm shadow-green-500/25 hover:shadow-md hover:shadow-green-500/30 transition-all duration-300"
            >
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span className="text-sm">我找到了</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all duration-300"
            >
              <Share2 className="w-4.5 h-4.5" />
              <span className="text-sm">帮忙转发</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDetail}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all duration-300"
            >
              <Eye className="w-4.5 h-4.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function LostItemCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-white/50 backdrop-blur-xl rounded-[20px] border border-white/30 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-100 rounded-full w-24 animate-pulse" />
        </div>
        <div className="h-7 bg-gray-100 rounded-full w-16 animate-pulse" />
      </div>
      
      <div className="h-5 bg-gray-100 rounded-lg w-32 mb-4 animate-pulse" />
      
      <div className="h-10 bg-gray-100 rounded-lg mb-5 animate-pulse" />
      
      <div className="flex gap-4 mb-5">
        <div className="h-5 bg-gray-100 rounded-lg w-32 animate-pulse" />
        <div className="h-5 bg-gray-100 rounded-lg w-28 animate-pulse" />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse" />
        <div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse" />
        <div className="h-6 bg-gray-100 rounded-full w-24 animate-pulse" />
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <div className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse" />
        <div className="flex-1 h-11 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-11 w-11 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </motion.div>
  )
}
