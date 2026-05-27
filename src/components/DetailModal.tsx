import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock, Phone, Tag, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import { LostItem } from '../types/lostItem'

interface DetailModalProps {
  item: LostItem | null
  isOpen: boolean
  onClose: () => void
}

const categoryColors: Record<LostItem['category'], string> = {
  '电子产品': 'bg-secondary/15 text-secondary-dark border-secondary/20',
  '证件卡片': 'bg-green-500/15 text-green-700 border-green-500/20',
  '书籍文具': 'bg-purple-500/15 text-purple-700 border-purple-500/20',
  '生活用品': 'bg-accent/30 text-yellow-700 border-accent/30',
  '其他': 'bg-neutral-200 text-neutral-600 border-neutral-300',
}

export default function DetailModal({ item, isOpen, onClose }: DetailModalProps) {
  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold text-neutral-800 flex-1">{item.title}</h2>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium border ${categoryColors[item.category]}`}
          >
            {item.category}
          </span>
        </div>

        <div className="glass-dark rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">物品描述</h3>
          <p className="text-neutral-700 leading-relaxed">{item.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">丢失地点</p>
              <p className="font-medium text-neutral-800">{item.location}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">丢失日期</p>
              <p className="font-medium text-neutral-800">{item.date} {item.time}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">联系方式</p>
              <p className="font-medium text-neutral-800">{item.contact}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-neutral-500">当前状态</p>
              <p className="font-medium text-neutral-800">{item.status}</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>联系失主认领</span>
          </motion.button>
        </motion.div>

        <div className="text-center text-xs text-neutral-500 pt-2">
          发布于 {new Date(item.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </Modal>
  )
}
