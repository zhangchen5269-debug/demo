import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2, Wand2, CheckCircle2, Edit3, Info } from 'lucide-react'
import LostItemCard from './LostItemCard'
import { parseLostItem, ParsedLostItem } from '../utils/api'
import { useLostItems } from '../hooks/useLostItems'

interface SmartRegisterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SmartRegisterModal({ isOpen, onClose }: SmartRegisterModalProps) {
  const [step, setStep] = useState<'input' | 'parsing' | 'preview' | 'success'>('input')
  const [input, setInput] = useState('')
  const [parsedItem, setParsedItem] = useState<ParsedLostItem | null>(null)
  const [editableItem, setEditableItem] = useState<Partial<ParsedLostItem>>({})
  const { addItem } = useLostItems()

  const handleParse = async () => {
    if (!input.trim()) return
    setStep('parsing')
    
    try {
      const result = await parseLostItem(input)
      setParsedItem(result)
      setEditableItem(result)
      setStep('preview')
    } catch (error) {
      console.error('Parse failed:', error)
      setStep('input')
      alert('解析失败，请重试')
    }
  }

  const handlePublish = () => {
    if (!parsedItem) return
    
    const item = { ...parsedItem, ...editableItem }
    addItem({
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location,
      date: item.date,
      time: item.time,
      contact: item.contact,
    })
    
    setStep('success')
    
    setTimeout(() => {
      onClose()
      setStep('input')
      setInput('')
      setParsedItem(null)
      setEditableItem({})
    }, 2000)
  }

  const editField = (field: keyof ParsedLostItem, value: string) => {
    setEditableItem(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {step === 'input' && '一键智能登记'}
                        {step === 'parsing' && 'AI 正在解析...'}
                        {step === 'preview' && '确认信息'}
                        {step === 'success' && '发布成功！'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {step === 'input' && '用自然语言描述失物信息'}
                        {step === 'parsing' && '正在提取物品信息...'}
                        {step === 'preview' && '请确认信息是否正确'}
                        {step === 'success' && '失物信息已发布'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-full hover:bg-white/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Step 1: Input */}
                  <AnimatePresence mode="wait">
                    {step === 'input' && (
                      <motion.div
                        key="input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                              <p className="font-medium text-gray-800 mb-1">示例输入：</p>
                              <p>「我在图书馆三楼丢了一个黑色的 AirPods Pro，大概今天下午3点左右，联系电话是13800138000」</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            描述你的失物
                          </label>
                          <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="请详细描述一下你丢失的物品，包括物品名称、颜色、特征、丢失地点、时间、联系方式等..."
                            rows={5}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                          />
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleParse}
                          disabled={!input.trim()}
                          className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Wand2 className="w-5 h-5" />
                          <span>AI 智能解析</span>
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Step 2: Parsing */}
                    {step === 'parsing' && (
                      <motion.div
                        key="parsing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="py-12 text-center"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-secondary p-1"
                        >
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary" />
                          </div>
                        </motion.div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">正在解析...</h3>
                        <p className="text-gray-500">AI 正在提取物品信息，请稍候</p>
                      </motion.div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 'preview' && parsedItem && (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          <div className="text-sm text-green-800">
                            <p className="font-medium">解析成功！</p>
                            <p className="text-green-600">以下是 AI 提取的信息，你可以编辑修正</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditableField
                            label="物品名称"
                            value={editableItem.title || parsedItem.title}
                            onChange={(val) => editField('title', val)}
                          />
                          <EditableField
                            label="分类"
                            value={editableItem.category || parsedItem.category}
                            onChange={(val) => editField('category', val as any)}
                          />
                          <EditableField
                            label="丢失地点"
                            value={editableItem.location || parsedItem.location}
                            onChange={(val) => editField('location', val)}
                          />
                          <EditableField
                            label="联系方式"
                            value={editableItem.contact || parsedItem.contact}
                            onChange={(val) => editField('contact', val)}
                          />
                          <EditableField
                            label="日期"
                            value={editableItem.date || parsedItem.date}
                            onChange={(val) => editField('date', val)}
                          />
                          <EditableField
                            label="时间"
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

                        <div className="pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">卡片预览：</p>
                          <div className="transform scale-75 origin-top">
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
                            onClick={() => setStep('input')}
                            className="flex-1 btn-secondary"
                          >
                            重新输入
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePublish}
                            className="flex-1 btn-primary"
                          >
                            确认发布
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-12 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25"
                        >
                          <CheckCircle2 className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">发布成功！</h3>
                        <p className="text-gray-500">失物信息已发布，正在返回首页...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
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
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <div className="flex gap-2">
          <InputComponent
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && !isTextarea && handleSave()}
            className={isTextarea 
              ? "w-full bg-white border border-primary/30 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              : "w-full bg-white border border-primary/30 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            }
            rows={isTextarea ? 3 : undefined}
            autoFocus
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1 group">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <button
        onClick={() => setIsEditing(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-between group-hover:shadow-sm"
      >
        <span>{value || '未填写'}</span>
        <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  )
}
