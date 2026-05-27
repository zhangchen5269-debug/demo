import { motion } from 'framer-motion'
import { Link2, Plus } from 'lucide-react'

interface HeaderProps {
  onAddClick: () => void
}

export default function Header({ onAddClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass sticky top-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-soft">
            <Link2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">MindLink</h1>
            <p className="text-xs text-neutral-600">校园失物招领平台</p>
          </div>
        </motion.div>

        <motion.button
          onClick={onAddClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center gap-2 shadow-soft"
        >
          <Plus className="w-5 h-5" />
          <span>登记失物</span>
        </motion.button>
      </div>
    </motion.header>
  )
}
