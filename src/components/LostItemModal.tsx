import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Pencil, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Tag,
  Palette,
  FileText,
  Send,
  Loader2,
  Wand2,
  CheckCircle2,
  Edit3,
  X
} from 'lucide-react'
import Modal from './Modal'
import LostItemCard from './LostItemCard'
import { LostItemFormData } from '../types/lostItem'
import { parseLostItem, ParsedLostItem } from '../utils/api'

interface LostItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LostItemFormData) => void
}

type TabType = 'manual' | 'ai'
type AISTep = 'input' | 'parsing' | 'preview' | 'success'

const CATEGORIES = ['背包', '水杯', '手机', '钥匙', '耳机', '身份证', '其他']
const COLORS = ['黑色', '白色', '灰色', '银色', '金色', '蓝色', '红色', '绿色', '黄色', '橙色', '紫色', '粉色', '棕色', '其他']
const FEATURES = ['全新', '有划痕', '有标签', '有刻字', '带壳', '带挂件', '限量版', '二手']

export default function LostItemModal({ isOpen, onClose, onSubmit }: LostItemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  
  // Manual form state
  const [manualForm, setManualForm] = useState<LostItemFormData & { color: string; features: string[] }>({
    title: '',
    description: '',
    category: '其他',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    contact: '',
    image: '',
    color: '',
    features: []
  })

  // AI form state
  const [aiStep, setAiStep] = useState<AISTep>('input')
  const [aiInput, setAiInput] = useState('')
  const [parsedItem, setParsedItem] = useState<ParsedLostItem | null>(null)
  const [editableItem, setEditableItem] = useState<Partial<ParsedLostItem>>({})

  const resetForms = () => {
    setManualForm({
      title: '',
      description: '',
      category: '其他',
      location: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      contact: '',
      image: '',
      color: '',
      features: []
    })
    setAiStep('input')
    setAiInput('')
    setParsedItem(null)
    setEditableItem({})
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...manualForm,
      features: manualForm.features
    })
    handleClose()
  }

  const handleAIParse = async () => {
    if (!aiInput.trim()) return
    setAiStep('parsing')
    
    try {
      const result = await parseLostItem(aiInput)
      const today = new Date().toISOString().split('T')[0]
      setParsedItem(result)
      setEditableItem({ ...result, date: today })
      setAiStep('preview')
    } catch (error) {
      console.error('Parse failed:', error)
      setAiStep('input')
      alert('解析失败，请重试或使用手动填写')
    }
  }

  const handleAIPublish = () => {
    if (!parsedItem) return
    
    const item = { ...parsedItem, ...editableItem }
    const today = new Date().toISOString().split('T')[0]
    
    onSubmit({
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      date: today,
      time: item.time,
      contact: item.contact,
    })
    
    setAiStep('success')
    
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const toggleFeature = (feature: string) => {
    setManualForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const editField = (field: keyof ParsedLostItem, value: string) => {
    setEditableItem(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="登记失物">
      <div className="space-y-6">
        {/* Tab Switcher */}
        <div className="relative flex items-center gap-2 p-1 bg-canvas-soft rounded-full border border-hairline">
          <motion.div
            className="absolute inset-y-1 bg-canvas rounded-full shadow-sm"
            initial={false}
            animate={{
              left: activeTab === 'manual' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setActiveTab('manual')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
              activeTab === 'manual' ? 'text-ink' : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Pencil className="w-4 h-4" />
            手动填写
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors z-10 ${
              activeTab === 'ai' ? 'text-ink' : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI 智能登记
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'manual' ? (
            <motion.form
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleManualSubmit}
              className="space-y-6"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  物品标题 <span className="text-ruby">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  placeholder="请输入物品名称"
                  className="input-field"
                />
              </div>

              {/* Category & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    物品类别 <span className="text-ruby">*</span>
                  </label>
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value as any })}
                    className="input-field"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    <Palette className="w-4 h-4 inline mr-1" />
                    颜色
                  </label>
                  <select
                    value={manualForm.color}
                    onChange={(e) => setManualForm({ ...manualForm, color: e.target.value })}
                    className="input-field"
                  >
                    <option value="">选择颜色</option>
                    {COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    拾到地点 <span className="text-ruby">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
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
                    value={manualForm.contact}
                    onChange={(e) => setManualForm({ ...manualForm, contact: e.target.value })}
                    placeholder="手机号或微信"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    拾到日期 <span className="text-ruby">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
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
                    value={manualForm.time}
                    onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  详细描述 <span className="text-ruby">*</span>
                </label>
                <textarea
                  required
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder="请详细描述物品特征（品牌、型号、特殊标记等）"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  物品特征（可多选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEATURES.map(feature => (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        manualForm.features.includes(feature)
                          ? 'bg-primary text-ink border-transparent shadow-sm'
                          : 'bg-canvas text-ink-mute border-hairline hover:border-primary/50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
              >
                <Send className="w-5 h-5" />
                发布失物
              </motion.button>
            </motion.form>
          ) : (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {aiStep === 'input' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-5 border border-hairline">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-ink-secondary">
                        <p className="font-medium text-ink mb-2">💡 如何使用：</p>
                        <p className="mb-2">用自然语言描述你拾到的物品，例如：</p>
                        <p className="text-ink-mute italic">「今天下午3点在图书馆三楼捡到一个黑色小米耳机，联系微信13800138000」</p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="请用自然语言描述你拾到的物品...
                    
包含信息越详细越好：
• 物品名称和外观
• 拾到的时间和地点
• 联系方式"
                    rows={6}
                    className="input-field resize-none"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAIParse}
                    disabled={!aiInput.trim()}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-5 h-5" />
                    AI 智能解析
                  </motion.button>
                </div>
              )}

              {aiStep === 'parsing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-deep p-1"
                  >
                    <div className="w-full h-full rounded-full bg-canvas flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-ink mb-2">AI 正在解析...</h3>
                  <p className="text-ink-mute">正在提取物品信息，请稍候</p>
                </motion.div>
              )}

              {aiStep === 'preview' && parsedItem && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-4 border border-hairline flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="text-sm text-ink-secondary">
                      <p className="font-medium text-ink">解析成功！</p>
                      <p className="text-ink-mute">以下是 AI 提取的信息，请确认或修改</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <EditableField
                      label="物品名称"
                      value={editableItem.title || parsedItem.title}
                      onChange={(val) => editField('title', val)}
                    />
                    <EditableField
                      label="物品类别"
                      value={editableItem.category || parsedItem.category}
                      onChange={(val) => editField('category', val as any)}
                    />
                    <EditableField
                      label="拾到地点"
                      value={editableItem.location || parsedItem.location}
                      onChange={(val) => editField('location', val)}
                    />
                    <EditableField
                      label="联系方式"
                      value={editableItem.contact || parsedItem.contact}
                      onChange={(val) => editField('contact', val)}
                    />
                    <EditableField
                      label="拾到日期"
                      value={editableItem.date || parsedItem.date}
                      onChange={(val) => editField('date', val)}
                    />
                    <EditableField
                      label="大致时间"
                      value={editableItem.time || parsedItem.time}
                      onChange={(val) => editField('time', val)}
                    />
                  </div>

                  <EditableField
                    label="详细描述"
                    value={editableItem.description || parsedItem.description}
                    onChange={(val) => editField('description', val)}
                    isTextarea
                  />

                  <div className="pt-2">
                    <p className="text-sm font-medium text-ink-secondary mb-3">卡片预览：</p>
                    <div className="transform scale-90 origin-left">
                      <LostItemCard
                        item={{
                          id: 'preview',
                          status: '待认领',
                          createdAt: new Date().toISOString(),
                          ...parsedItem,
                          ...editableItem,
                        }}
                        index={0}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAiStep('input')}
                      className="flex-1 btn-secondary"
                    >
                      重新输入
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAIPublish}
                      className="flex-1 btn-primary"
                    >
                      确认发布
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {aiStep === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-soft"
                  >
                    <CheckCircle2 className="w-12 h-12 text-ink" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-ink mb-2">发布成功！</h3>
                  <p className="text-ink-mute">失物信息已发布，正在返回首页...</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}

function EditableField({
  label,
  value,
  onChange,
  isTextarea = false,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  isTextarea?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const handleSave = () => {
    onChange(tempValue)
    setIsEditing(false)
  }

  const InputComponent = isTextarea ? 'textarea' : 'input'

  if (isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-mute">{label}</label>
        <InputComponent
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && !isTextarea && handleSave()}
          className={isTextarea 
            ? "w-full bg-canvas border border-primary/30 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            : "w-full bg-canvas border border-primary/30 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30"
          }
          rows={isTextarea ? 3 : undefined}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="space-y-1 group">
      <label className="text-xs font-medium text-ink-mute">{label}</label>
      <button
        onClick={() => setIsEditing(true)}
        className="w-full text-left bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink hover:border-primary/30 hover:bg-primary-bg-subdued transition-all flex items-center justify-between group-hover:shadow-soft"
      >
        <span>{value || '未填写'}</span>
        <Edit3 className="w-4 h-4 text-ink-mute opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
      </button>
    </div>
  )
}
