import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Upload, 
  Loader2,
  Sparkles,
  Wand2,
  Edit3,
  CheckCircle2
} from 'lucide-react'
import Modal from './Modal'
import { analyzeLostItemImage, ImageAnalysisResult, generateSearchQueryFromImageAnalysis } from '../utils/api'

interface ImageSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string, fromImage?: boolean) => void
}

type Step = 'upload' | 'analyzing' | 'result' | 'editing'

export default function ImageSearchModal({ isOpen, onClose, onSearch }: ImageSearchModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [image, setImage] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null)
  const [editedQuery, setEditedQuery] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetModal = () => {
    setStep('upload')
    setImage('')
    setAnalysisResult(null)
    setEditedQuery('')
    setError('')
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setError('图片大小不能超过4MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('只支持 JPG、PNG、WebP 格式的图片')
      return
    }

    setError('')
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setImage(result)
      setStep('upload')
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!image) return

    setStep('analyzing')
    setError('')

    try {
      const result = await analyzeLostItemImage(image)
      setAnalysisResult(result)
      const query = generateSearchQueryFromImageAnalysis(result)
      setEditedQuery(query)
      setStep('result')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '图片分析失败'

      if (msg.includes('401') || msg.includes('过期') || msg.includes('认证')) {
        setError('AI 密钥已过期，请联系管理员更新密钥。')
      } else if (msg.includes('fetch') || msg.includes('网络') || msg.includes('Failed to fetch')) {
        setError('无法连接 AI 服务，请检查网络连接或代理设置。')
      } else {
        setError(`图片分析失败：${msg}`)
      }

      console.error('图片分析失败:', msg)
      setStep('upload')
    }
  }

  const handleStartSearch = () => {
    if (!editedQuery.trim()) {
      setError('请输入搜索内容')
      return
    }
    onSearch(editedQuery, true)
    handleClose()
  }

  const handleEditQuery = () => {
    setStep('editing')
  }

  const handleSaveEdit = () => {
    setStep('result')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI 图片识别搜索">
      <div className="space-y-6">
        {step === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-5 border border-hairline">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-ink-secondary">
                  <p className="font-medium text-ink mb-2">💡 使用说明：</p>
                  <p className="mb-1">上传失物或疑似失物的图片，AI 将自动分析图片内容并生成搜索描述。</p>
                  <p className="text-ink-mute text-xs">适用于：当您看到可疑物品但不知道如何描述时。</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {image ? (
              <div className="space-y-4">
                <div className="relative group">
                  <div className="w-full h-64 bg-canvas-soft rounded-xl overflow-hidden border border-hairline">
                    <img 
                      src={image} 
                      alt="上传的图片" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setImage('')
                      setStep('upload')
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-ruby text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!image}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
                >
                  <Wand2 className="w-5 h-5" />
                  AI 开始识别
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-12 border-2 border-dashed border-hairline rounded-xl bg-canvas-soft/50 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary-bg-subdued/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary-bg-subdued flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium text-ink-secondary">点击上传图片</p>
                  <p className="text-sm text-ink-mute mt-1">支持 JPG、PNG、WebP，不超过4MB</p>
                </div>
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'analyzing' && (
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
            <h3 className="text-lg font-semibold text-ink mb-2">AI 正在识别图片...</h3>
            <p className="text-ink-mute">正在分析图片内容，请稍候</p>
          </motion.div>
        )}

        {step === 'result' && analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-primary-bg-subdued to-primary-bg-subdued rounded-xl p-4 border border-hairline flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
              <div className="text-sm text-ink-secondary">
                <p className="font-medium text-ink">识别成功！</p>
                <p className="text-ink-mute">以下是 AI 识别的物品信息</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-canvas-soft rounded-lg p-4 border border-hairline">
                <p className="text-xs text-ink-mute mb-1">物品类型</p>
                <p className="text-sm font-medium text-ink">{analysisResult.itemType || '未知'}</p>
              </div>
              <div className="bg-canvas-soft rounded-lg p-4 border border-hairline">
                <p className="text-xs text-ink-mute mb-1">识别颜色</p>
                <p className="text-sm font-medium text-ink">{analysisResult.color || '未知'}</p>
              </div>
            </div>

            <div className="bg-canvas-soft rounded-lg p-4 border border-hairline">
              <p className="text-xs text-ink-mute mb-2">详细描述</p>
              <p className="text-sm text-ink leading-relaxed">{analysisResult.description}</p>
            </div>

            {analysisResult.features && analysisResult.features.length > 0 && (
              <div>
                <p className="text-xs text-ink-mute mb-2">识别特征</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-primary-bg-subdued text-ink-secondary rounded-full text-xs border border-hairline"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink-secondary">生成的搜索描述</p>
                <button
                  onClick={handleEditQuery}
                  className="text-xs text-primary hover:text-primary-deep flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  编辑
                </button>
              </div>
              <div className="bg-canvas border border-hairline rounded-lg px-4 py-3">
                <p className="text-sm text-ink">{editedQuery}</p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setImage('')
                  setAnalysisResult(null)
                  setEditedQuery('')
                  setStep('upload')
                }}
                className="flex-1 btn-secondary"
              >
                重新上传
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartSearch}
                className="flex-1 btn-primary"
              >
                开始搜索
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'editing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-canvas-soft rounded-xl p-4 border border-hairline">
              <p className="text-sm font-medium text-ink-secondary mb-3">编辑搜索描述</p>
              <textarea
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                rows={4}
                className="w-full bg-canvas border border-hairline rounded-lg px-4 py-3 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="输入搜索内容..."
              />
              <p className="text-xs text-ink-mute mt-2">您可以手动编辑搜索描述，使其更准确</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('result')}
                className="flex-1 btn-secondary"
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveEdit}
                className="flex-1 btn-primary"
              >
                保存
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
