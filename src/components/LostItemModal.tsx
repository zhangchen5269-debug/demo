import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, MapPin, Calendar, Clock, User } from 'lucide-react'
import Modal from './Modal'
import { LostItemFormData } from '../types/lostItem'

interface LostItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LostItemFormData) => void
}

const categories = ['电子产品', '证件卡片', '书籍文具', '生活用品', '其他'] as const

export default function LostItemModal({ isOpen, onClose, onSubmit }: LostItemModalProps) {
  const [formData, setFormData] = useState<LostItemFormData>({
    title: '',
    description: '',
    category: '其他',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    contact: '',
    image: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: '',
      description: '',
      category: '其他',
      location: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      contact: '',
      image: '',
    })
    onClose()
  }

  const handleChange = (field: keyof LostItemFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="登记失物">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            物品名称 <span className="text-ruby">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="请输入物品名称"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            物品类别 <span className="text-ruby">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChange('category', cat)}
                className={`py-2 px-4 rounded-lg text-sm font-medium transition-all border ${
                  formData.category === cat
                    ? 'bg-primary text-ink border-transparent'
                    : 'bg-canvas text-ink-secondary border-hairline hover:bg-canvas-soft'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            物品描述 <span className="text-ruby">*</span>
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="请详细描述物品特征（颜色、品牌、型号等）"
            rows={4}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              丢失地点 <span className="text-ruby">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="例如：图书馆三楼"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              <User className="w-4 h-4 inline mr-1" />
              联系方式 <span className="text-ruby">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              placeholder="手机号或微信"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              丢失日期 <span className="text-ruby">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              大致时间
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-2">
            <Upload className="w-4 h-4 inline mr-1" />
            添加图片（可选）
          </label>
          <div className="border-2 border-dashed border-hairline rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-ink-mute mx-auto mb-2" />
            <p className="text-sm text-ink-secondary">点击或拖拽上传图片</p>
            <p className="text-xs text-ink-mute mt-1">支持 JPG、PNG 格式</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            取消
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex-1"
          >
            确认登记
          </motion.button>
        </div>
      </form>
    </Modal>
  )
}
