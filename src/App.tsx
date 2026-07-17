import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import BackgroundDecorations from './components/BackgroundDecorations'
import SearchBar from './components/SearchBar'
import LostItemList from './components/LostItemList'
import LostItemModal from './components/LostItemModal'
import DetailModal from './components/DetailModal'
import ImageSearchModal from './components/ImageSearchModal'
import { useSmartSearch } from './hooks/useSmartSearch'
import { LostItem, LostItemFormData } from './types/lostItem'
import { motion } from 'framer-motion'
import { checkAIHealth, AIStatus } from './utils/api'

function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null)
  const [aiStatus, setAIStatus] = useState<AIStatus>('checking')

  const {
    items,
    query,
    isSearching,
    matchedIds,
    searchMode,
    setSearchMode,
    addItem,
    searchItems,
    handleSearch,
    searchByImageKeywords,
  } = useSmartSearch()

  // 启动时检查 AI 健康状态
  const checkStatus = useCallback(async () => {
    setAIStatus('checking')
    const status = await checkAIHealth()
    setAIStatus(status)
    // AI 不可用时强制切回关键词模式
    if (status !== 'online' && searchMode === 'ai') {
      setSearchMode('keyword')
    }
  }, [searchMode, setSearchMode])

  useEffect(() => {
    checkStatus()
  }, [])

  // AI 不可用时不允许切换到 AI 模式
  const handleModeChange = useCallback((mode: 'keyword' | 'ai') => {
    if (mode === 'ai' && aiStatus !== 'online') {
      // 触发重新检查（可能是暂时性故障）
      checkStatus()
      return
    }
    setSearchMode(mode)
  }, [aiStatus, setSearchMode, checkStatus])

  // AI 模式时只显示匹配的物品；关键词模式时用 searchItems 过滤
  // 图片搜索时 query 为空但 matchedIds 有值，也显示匹配结果
  const filteredItems = query.trim()
    ? (searchMode === 'ai'
        ? items.filter(item => matchedIds.includes(item.id))
        : searchItems(query))
    : matchedIds.length > 0
      ? items.filter(item => matchedIds.includes(item.id))
      : items

  const handleAddItem = (formData: LostItemFormData) => {
    addItem(formData)
  }

  const handleFound = (item: LostItem) => {
    alert(`感谢！你已标记「${item.title}」为已找到！`)
  }

  const handleShare = (item: LostItem) => {
    alert(`已分享「${item.title}」的失物信息！`)
  }

  const handleDetail = (item: LostItem) => {
    setSelectedItem(item)
    setIsDetailModalOpen(true)
  }

  const handleImageSearch = (searchQuery: string, fromImage: boolean = false) => {
    if (fromImage) {
      // 图片搜索：后台用关键词搜索，不显示在输入框中
      searchByImageKeywords(searchQuery)
    } else {
      handleSearch(searchQuery)
    }
  }

  return (
    <div className="min-h-screen">
      <BackgroundDecorations />
      <Header onAddClick={() => setIsAddModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-ink mb-2">失物招领</h2>
          <p className="text-ink-mute">帮助失主快速找回遗失物品</p>
        </motion.div>

        <SearchBar
          value={query}
          onChange={handleSearch}
          isSearching={isSearching}
          searchMode={searchMode}
          onModeChange={handleModeChange}
          onImageSearch={() => setIsImageSearchOpen(true)}
          aiStatus={aiStatus}
        />

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-ink-mute">
            {query.trim() || matchedIds.length > 0 ? (
              <>
                共找到 <span className="font-bold text-primary">{filteredItems.length}</span> 条失物信息
                {matchedIds.length > 0 && (
                  <span className="ml-2 text-xs text-ink-mute">
                    ({!query.trim() && <><span className="font-semibold text-primary">图片识别</span> — </>}
                     <span className="font-semibold text-primary">{matchedIds.length}</span> 条匹配)
                  </span>
                )}
              </>
            ) : (
              <>
                共 <span className="font-bold text-primary">{items.length}</span> 条失物信息
              </>
            )}
          </p>
          {(query || matchedIds.length > 0) && (
            <button
              onClick={() => { handleSearch(''); setSearchMode('keyword') }}
              className="text-sm text-primary hover:text-primary-deep transition-colors"
            >
              清除搜索
            </button>
          )}
        </div>

        <LostItemList 
          items={filteredItems} 
          highlightedIds={query.trim() ? matchedIds : []}
          onFound={handleFound}
          onShare={handleShare}
          onDetail={handleDetail}
        />
      </main>

      <LostItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        aiStatus={aiStatus}
      />

      <DetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedItem(null)
        }}
      />

      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSearch={handleImageSearch}
      />
    </div>
  )
}

export default App
