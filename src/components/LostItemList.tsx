import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { LostItem } from '../types/lostItem'
import LostItemCard, { LostItemCardSkeleton } from './LostItemCard'

interface LostItemListProps {
  items: LostItem[]
  loading?: boolean
  highlightedIds?: string[]
  onItemClick?: (item: LostItem) => void
  onFound?: (item: LostItem) => void
  onShare?: (item: LostItem) => void
  onDetail?: (item: LostItem) => void
}

export default function LostItemList({ 
  items, 
  loading = false, 
  highlightedIds = [],
  onItemClick, 
  onFound, 
  onShare, 
  onDetail 
}: LostItemListProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[0, 1, 2].map((index) => (
          <LostItemCardSkeleton key={index} index={index} />
        ))}
      </motion.div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-canvas backdrop-blur-xl rounded-[20px] border border-hairline shadow-soft text-center py-16"
      >
        <Package className="w-16 h-16 text-ink-mute mx-auto mb-4" />
        <p className="text-ink-secondary text-lg font-medium">暂无失物信息</p>
        <p className="text-ink-mute text-sm mt-2">点击上方按钮登记失物</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {items.map((item, index) => (
        <LostItemCard
          key={item.id}
          item={item}
          index={index}
          isHighlighted={highlightedIds.includes(item.id)}
          onFound={() => onFound?.(item)}
          onShare={() => onShare?.(item)}
          onDetail={() => onDetail?.(item)}
        />
      ))}
    </motion.div>
  )
}
