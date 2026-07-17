import { useState, useRef } from 'react'
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
  X,
  Upload,
  Image as ImageIcon,
  Camera,
  AlertCircle,
  WifiOff
} from 'lucide-react'
import Modal from './Modal'
import LostItemCard from './LostItemCard'
import { LostItemFormData } from '../types/lostItem'
import { parseLostItem, ParsedLostItem, analyzeImageForRegistration, ImageRegistrationResult, AIStatus } from '../utils/api'

interface LostItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LostItemFormData) => void
  aiStatus?: AIStatus
}

type TabType = 'manual' | 'ai-text' | 'ai-image'
type AIStep = 'input' | 'parsing' | 'preview' | 'success'
type ImageAIStep = 'upload' | 'analyzing' | 'form' | 'success'

const CATEGORIES = ['背包', '水杯', '手机', '钥匙', '耳机', '身份证', '其他']
const COLORS = ['黑色', '白色', '灰色', '银色', '金色', '蓝色', '红色', '绿色', '黄色', '橙色', '紫色', '粉色', '棕色', '其他']
const FEATURES = ['全新', '有划痕', '有标签', '有刻字', '带壳', '带挂件', '限量版', '二手']

function ImageUploader({ 
  image, 
  onChange 
}: { 
  image?: string
  onChange: (image: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      alert('图片大小不能超过4MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('只支持 JPG、PNG、WebP 格式的图片')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    onChange('')
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {image ? (
        <div className="relative group">
          <div className="w-full h-40 bg-canvas-soft rounded-xl overflow-hidden border border-hairline">
            <img 
              src={image} 
              alt="预览" 
              className="w-full h-full object-cover"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-7 h-7 bg-ruby text-white rounded-full flex items-center justify-center shadow-md"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      ) : (
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 border-2 border-dashed border-hairline rounded-xl bg-canvas-soft/50 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary-bg-subdued/50 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-primary-bg-subdued flex items-center justify-center">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink-secondary">点击上传图片</p>
            <p className="text-xs text-ink-mute mt-1">支持 JPG、PNG、WebP，不超过4MB</p>
          </div>
        </motion.button>
      )}
    </div>
  )
}

export default function LostItemModal({ isOpen, onClose, onSubmit, aiStatus = 'checking' }: LostItemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual')

  const [aiError, setAiError] = useState<string>('')
  const [imageAiError, setImageAiError] = useState<string>('')
  
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

  const [aiStep, setAiStep] = useState<AIStep>('input')
  const [aiInput, setAiInput] = useState('')
  const [parsedItem, setParsedItem] = useState<ParsedLostItem | null>(null)
  const [editableItem, setEditableItem] = useState<Partial<ParsedLostItem>>({})
  const [aiImage, setAiImage] = useState<string>('')

  const [imageAiStep, setImageAiStep] = useState<ImageAIStep>('upload')
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [imageResult, setImageResult] = useState<ImageRegistrationResult | null>(null)
  const [imageForm, setImageForm] = useState<LostItemFormData & { color: string; features: string[] }>({
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
    setAiImage('')
    setImageAiStep('upload')
    setUploadedImage('')
    setImageResult(null)
    setImageForm({
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
    setAiError('')

    try {
      const result = await parseLostItem(aiInput)
      const today = new Date().toISOString().split('T')[0]
      setParsedItem(result)
      setEditableItem({ ...result, date: today })
      setAiStep('preview')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '解析失败'
      console.error('Parse failed:', msg)

      if (msg.includes('401') || msg.includes('过期') || msg.includes('认证')) {
        setAiError('AI 密钥已过期，请联系管理员更新。你可以先用「手动填写」标签页登记。')
      } else if (msg.includes('fetch') || msg.includes('网络') || msg.includes('Failed to fetch')) {
        setAiError('无法连接 AI 服务，请检查网络。你可以先用「手动填写」标签页登记。')
      } else {
        setAiError(`AI 解析失败：${msg}。请重试或切换到手动填写。`)
      }

      setAiStep('input')
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
      image: aiImage,
      features: []
    })
    
    setAiStep('success')
    
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const handleImageAnalyze = async () => {
    if (!uploadedImage) return
    setImageAiStep('analyzing')
    setImageAiError('')

    try {
      const result = await analyzeImageForRegistration(uploadedImage)
      setImageResult(result)
      setImageForm({
        title: result.title,
        description: result.description,
        category: result.category,
        location: result.location,
        date: result.date,
        time: result.time,
        contact: result.contact,
        image: uploadedImage,
        color: result.color,
        features: result.features
      })
      setImageAiStep('form')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '图像分析失败'
      console.error('图像分析失败:', msg)

      if (msg.includes('401') || msg.includes('过期') || msg.includes('认证')) {
        setImageAiError('AI 密钥已过期，请联系管理员更新。你可以先用「手动填写」标签页登记。')
      } else if (msg.includes('fetch') || msg.includes('网络') || msg.includes('Failed to fetch')) {
        setImageAiError('无法连接 AI 服务，请检查网络。你可以先用「手动填写」标签页登记。')
      } else {
        setImageAiError(`图像分析失败：${msg}。请重试或切换到手动填写。`)
      }

      setImageAiStep('upload')
    }
  }

  const handleImageFormSubmit = () => {
    onSubmit({
      ...imageForm,
      features: imageForm.features
    })
    setImageAiStep('success')
    
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

  const toggleImageFeature = (feature: string) => {
    setImageForm(prev => ({
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
        <div className="relative flex items-center gap-2 p-1 bg-canvas-soft rounded-full border border-hairline">
          <motion.div
            className="absolute inset-y-1 bg-canvas rounded-full shadow-sm"
            initial={false}
            animate={{
              left: activeTab === 'manual' ? '4px' : activeTab === 'ai-text' ? 'calc(33.333% + 2px)' : 'calc(66.666% + 2px)',
              width: 'calc(33.333% - 6px)'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setActiveTab('manual')}
            className={`relative flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-colors z-10 ${
              activeTab === 'manual' ? 'text-ink' : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            手动填写
          </button>
          <button
            onClick={() => setActiveTab('ai-text')}
            className={`relative flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-colors z-10 ${
              activeTab === 'ai-text' ? 'text-ink' : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            [AI]文字登记
          </button>
          <button
            onClick={() => setActiveTab('ai-image')}
            className={`relative flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-colors z-10 ${
              activeTab === 'ai-image' ? 'text-ink' : 'text-ink-mute hover:text-ink'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            [AI]图片识别
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'manual' && (
            <motion.form
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleManualSubmit}
              className="space-y-6"
            >
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

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  添加图片（可选）
                </label>
                <ImageUploader 
                  image={manualForm.image} 
                  onChange={(image) => setManualForm({ ...manualForm, image })} 
                />
              </div>

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
          )}

          {activeTab === 'ai-text' && (
            <motion.div
              key="ai-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {aiStep === 'input' && (
                <div className="space-y-6">
                  {/* AI 状态警告 */}
                  {aiStatus !== 'online' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        {aiStatus === 'degraded' ? (
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-ink mb-1">
                            {aiStatus === 'degraded' ? 'AI 密钥已过期' : 'AI 服务未连接'}
                          </p>
                          <p className="text-xs text-ink-mute">
                            {aiStatus === 'degraded'
                              ? '智能解析暂时不可用，建议切换到「手动填写」标签页。'
                              : '无法连接 AI 服务，请检查网络或代理设置。'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 错误消息 */}
                  {aiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-red-700">{aiError}</p>
                          <button
                            type="button"
                            onClick={() => { setAiError(''); setActiveTab('manual') }}
                            className="text-xs text-primary font-medium hover:text-primary-deep transition-colors mt-1.5"
                          >
                            切换到手动填写 →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-gradient-to-br from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-5 border border-hairline">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-ink-secondary">
                        <p className="font-medium text-ink mb-2">💡 使用说明：</p>
                        <p className="mb-2">用自然语言描述你拾到的物品，例如：</p>
                        <p className="text-ink-mute italic">「今天下午3点在图书馆三楼捡到一个黑色小米耳机，联系微信13800138000」</p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="请用自然语言描述你捡到或丢失的物品...

包含信息越详细越好：
• 物品名称和外观
• 捡到或丢失的时间和地点
• 联系方式"
                    rows={6}
                    className="input-field resize-none"
                  />

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      添加图片（可选）
                    </label>
                    <ImageUploader
                      image={aiImage}
                      onChange={setAiImage}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAIParse}
                    disabled={!aiInput.trim() || aiStatus === 'offline'}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-5 h-5" />
                    {aiStatus === 'offline'
                      ? 'AI 不可用'
                      : aiStatus === 'degraded'
                      ? 'AI 解析（可能失败）'
                      : 'AI 智能解析'}
                  </motion.button>
                </div>
              )}

              {aiStep === 'parsing' && (
                <div className="py-16 text-center">
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
                </div>
              )}

              {aiStep === 'preview' && parsedItem && (
                <div className="space-y-6">
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

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      添加图片（可选）
                    </label>
                    <ImageUploader 
                      image={aiImage} 
                      onChange={setAiImage} 
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-medium text-ink-secondary mb-3">卡片预览：</p>
                    <div className="transform scale-90 origin-left">
                      <LostItemCard
                        item={{
                          id: 'preview',
                          status: '待认领',
                          createdAt: new Date().toISOString(),
                          image: aiImage,
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
                </div>
              )}

              {aiStep === 'success' && (
                <div className="py-16 text-center">
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
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ai-image' && (
            <motion.div
              key="ai-image"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {imageAiStep === 'upload' && (
                <div className="space-y-6">
                  {/* AI 状态警告 */}
                  {aiStatus !== 'online' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        {aiStatus === 'degraded' ? (
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-ink mb-1">
                            {aiStatus === 'degraded' ? 'AI 密钥已过期' : 'AI 服务未连接'}
                          </p>
                          <p className="text-xs text-ink-mute">
                            {aiStatus === 'degraded'
                              ? '图片识别暂时不可用，建议切换到「手动填写」标签页。'
                              : '无法连接 AI 服务，请检查网络或代理设置。'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 错误消息 */}
                  {imageAiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-red-700">{imageAiError}</p>
                          <button
                            type="button"
                            onClick={() => { setImageAiError(''); setActiveTab('manual') }}
                            className="text-xs text-primary font-medium hover:text-primary-deep transition-colors mt-1.5"
                          >
                            切换到手动填写 →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-gradient-to-br from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-5 border border-hairline">
                    <div className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-ink-secondary">
                        <p className="font-medium text-ink mb-2">📸 使用说明：</p>
                        <p className="mb-2">上传失物图片，AI 将自动识别物品信息并填充表单</p>
                        <p className="text-ink-mute">识别完成后可以修改信息再发布</p>
                      </div>
                    </div>
                  </div>

                  <ImageUploader
                    image={uploadedImage}
                    onChange={setUploadedImage}
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleImageAnalyze}
                    disabled={!uploadedImage || aiStatus === 'offline'}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-5 h-5" />
                    {aiStatus === 'offline'
                      ? 'AI 不可用'
                      : aiStatus === 'degraded'
                      ? '开始识别（可能失败）'
                      : '开始识别'}
                  </motion.button>
                </div>
              )}

              {imageAiStep === 'analyzing' && (
                <div className="py-16 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary-deep p-1"
                  >
                    <div className="w-full h-full rounded-full bg-canvas flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-ink mb-2">AI 正在识别...</h3>
                  <p className="text-ink-mute">正在分析图片内容，请稍候</p>
                </div>
              )}

              {imageAiStep === 'form' && imageResult && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-4 border border-hairline flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="text-sm text-ink-secondary">
                      <p className="font-medium text-ink">识别成功！</p>
                      <p className="text-ink-mute">检查信息并发布</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-full h-32 bg-canvas-soft rounded-xl overflow-hidden border border-hairline">
                      <img 
                        src={uploadedImage} 
                        alt="上传的图片" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      物品标题 <span className="text-ruby">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={imageForm.title}
                      onChange={(e) => setImageForm({ ...imageForm, title: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        物品类别 <span className="text-ruby">*</span>
                      </label>
                      <select
                        value={imageForm.category}
                        onChange={(e) => setImageForm({ ...imageForm, category: e.target.value as any })}
                        className="input-field"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        颜色
                      </label>
                      <select
                        value={imageForm.color}
                        onChange={(e) => setImageForm({ ...imageForm, color: e.target.value })}
                        className="input-field"
                      >
                        <option value="">选择颜色</option>
                        {COLORS.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        拾到地点 <span className="text-ruby">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imageForm.location}
                        onChange={(e) => setImageForm({ ...imageForm, location: e.target.value })}
                        placeholder="例如：图书馆三楼"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        联系方式 <span className="text-ruby">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={imageForm.contact}
                        onChange={(e) => setImageForm({ ...imageForm, contact: e.target.value })}
                        placeholder="手机号或微信"
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        拾到日期 <span className="text-ruby">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={imageForm.date}
                        onChange={(e) => setImageForm({ ...imageForm, date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-secondary mb-2">
                        大致时间
                      </label>
                      <input
                        type="time"
                        value={imageForm.time}
                        onChange={(e) => setImageForm({ ...imageForm, time: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      详细描述 <span className="text-ruby">*</span>
                    </label>
                    <textarea
                      required
                      value={imageForm.description}
                      onChange={(e) => setImageForm({ ...imageForm, description: e.target.value })}
                      rows={3}
                      className="input-field resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-secondary mb-2">
                      物品特征（可多选）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FEATURES.map(feature => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleImageFeature(feature)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            imageForm.features.includes(feature)
                              ? 'bg-primary text-ink border-transparent shadow-sm'
                              : 'bg-canvas text-ink-mute border-hairline hover:border-primary/50'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-medium text-ink-secondary mb-3">卡片预览：</p>
                    <div className="transform scale-90 origin-left">
                      <LostItemCard
                        item={{
                          id: 'preview',
                          status: '待认领',
                          createdAt: new Date().toISOString(),
                          ...imageForm,
                        }}
                        index={0}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setImageAiStep('upload')}
                      className="flex-1 btn-secondary"
                    >
                      重新上传
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleImageFormSubmit}
                      className="flex-1 btn-primary"
                    >
                      确认发布
                    </motion.button>
                  </div>
                </div>
              )}

              {imageAiStep === 'success' && (
                <div className="py-16 text-center">
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
                </div>
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
