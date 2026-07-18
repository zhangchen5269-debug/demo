import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { LostItem, LostItemFormData } from '../types/lostItem'
import { semanticSearchItems } from '../utils/api'

const SAMPLE_ITEMS: LostItem[] = [
  {
    id: '1',
    title: '黑色小米无线蓝牙耳机',
    description: '在图书馆三楼自习室遗失，充电盒完好，耳机在充电盒内，充电盒上有轻微划痕',
    category: '电子产品',
    location: '图书馆三楼自习室',
    date: '2024-01-15',
    time: '14:30',
    contact: '138****1234',
    color: '#000000',
    features: ['无线', '小米', '充电盒完整', '轻微划痕'],
    status: '待认领',
    createdAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    title: '校园一卡通（张伟）',
    description: '在食堂门口拾到，卡上姓名为张伟，请失主带身份证认领，卡套是蓝色的',
    category: '证件卡片',
    location: '第一食堂门口',
    date: '2024-01-14',
    time: '12:15',
    contact: '139****5678',
    color: '#3b82f6',
    features: ['有卡套', '蓝色', '有姓名', '有照片'],
    status: '待认领',
    createdAt: '2024-01-14T12:15:00Z',
  },
  {
    id: '3',
    title: '高等数学教材',
    description: '第七版，封面有轻微折痕，在教学楼A座205教室遗失，书内有笔记标记',
    category: '书籍文具',
    location: '教学楼A座205',
    date: '2024-01-13',
    time: '16:45',
    contact: '137****9012',
    color: '#f97316',
    features: ['第七版', '有笔记', '轻微折痕', '同济版'],
    status: '待认领',
    createdAt: '2024-01-13T16:45:00Z',
  },
  {
    id: '4',
    title: '星巴克保温杯',
    description: '银色星巴克保温杯，有咖啡渍，在操场看台上遗失',
    category: '生活用品',
    location: '操场看台',
    date: '2024-01-12',
    time: '18:00',
    contact: '136****3456',
    color: '#c0c0c0',
    features: ['银色', '星巴克', '有咖啡渍', '保冷杯'],
    status: '已认领',
    createdAt: '2024-01-12T18:00:00Z',
  },
]

function simpleKeywordMatch(query: string, items: LostItem[]): string[] {
  if (!query.trim()) return []
  
  const lowerQuery = query.toLowerCase()
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 0)
  
  // 识别物品类型关键词
  const itemTypeWords = words.filter(w => 
    ['耳机', '蓝牙', '手机', '钱包', '钥匙', '身份证', '一卡通', '书包', '背包', 
     '水杯', '保温杯', '书', '教材', '笔记本', '电脑', '平板', '充电宝', '数据线'].some(
      type => w.includes(type) || type.includes(w)
    )
  )
  
  // 识别地点关键词（这些不应该单独作为匹配条件）
  const locationWords = words.filter(w => 
    ['图书馆', '食堂', '教室', '操场', '教学楼', '宿舍', '食堂', '体育馆'].some(
      loc => w.includes(loc) || loc.includes(w)
    )
  )
  
  const scores: Map<string, number> = new Map()
  
  items.forEach(item => {
    const titleLower = item.title.toLowerCase()
    const descriptionLower = item.description.toLowerCase()
    const locationLower = item.location.toLowerCase()
    
    let score = 0
    let hasItemTypeMatch = false
    
    // 检查物品类型关键词匹配（最重要）
    itemTypeWords.forEach(word => {
      if (titleLower.includes(word)) {
        score += 30
        hasItemTypeMatch = true
      }
      if (descriptionLower.includes(word)) {
        score += 10
      }
    })
    
    // 如果没有物品类型匹配，即使地点匹配也不给分
    if (!hasItemTypeMatch) {
      // 不匹配，返回0分
      return
    }
    
    // 检查地点匹配（次要条件）
    locationWords.forEach(word => {
      if (locationLower.includes(word)) {
        score += 5
      }
    })
    
    // 只要有物品类型匹配就给基础分
    if (hasItemTypeMatch) {
      score += 10
    }
    
    if (score > 0) {
      scores.set(item.id, score)
    }
  })
  
  const sortedScores = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)
  
  console.log('Keyword search results:', sortedScores)
  return sortedScores
}

export function useSmartSearch() {
  const [items, setItems] = useLocalStorage<LostItem[]>('mindlink-lost-items', SAMPLE_ITEMS)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<'keyword' | 'ai'>('keyword')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const addItem = (formData: LostItemFormData) => {
    const newItem: LostItem = {
      ...formData,
      id: Date.now().toString(),
      status: '待认领',
      createdAt: new Date().toISOString(),
    }
    setItems([newItem, ...items])
    return newItem
  }

  const updateItem = (id: string, updates: Partial<LostItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const getItemById = (id: string) => {
    return items.find(item => item.id === id)
  }

  const searchItems = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return items
    
    const lowerQuery = searchQuery.toLowerCase()
    return items.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.location.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    )
  }, [items])

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!searchQuery.trim()) {
      setMatchedIds([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    debounceTimerRef.current = setTimeout(async () => {
      console.log('Search mode:', searchMode)

      if (searchMode === 'keyword') {
        console.log('Using keyword search')
        const matches = simpleKeywordMatch(searchQuery, items)
        console.log('Keyword matches:', matches)
        setMatchedIds(matches)
        setIsSearching(false)
      } else {
        console.log('Using AI semantic search')
        try {
          const matched = await semanticSearchWithAI(searchQuery, items)
          console.log('AI matches:', matched)
          setMatchedIds(matched)
        } catch (error) {
          console.error('AI search failed, falling back to keyword:', error)
          // 速率限制或任何错误都静默降级到关键词搜索
          const matches = simpleKeywordMatch(searchQuery, items)
          console.log('Fallback keyword matches:', matches)
          setMatchedIds(matches)
          // 切回关键词模式避免重复触发 AI 调用
          setSearchMode('keyword')
        }
        setIsSearching(false)
      }
    }, 400)
  }, [items, searchMode])

  /** 图片搜索：用关键字后台搜索，不在输入框显示文字 */
  const searchByImageKeywords = useCallback(async (keywords: string) => {
    if (!keywords.trim()) return

    // 切换到 AI 模式
    setSearchMode('ai')
    setIsSearching(true)

    try {
      const matched = await semanticSearchWithAI(keywords, items)
      setMatchedIds(matched)
    } catch (error) {
      console.error('Image keyword search failed, falling back to keyword:', error)
      const matches = simpleKeywordMatch(keywords, items)
      setMatchedIds(matches)
    }
    setIsSearching(false)
  }, [items])

  const filteredItems = useMemo(() => {
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    items: filteredItems,
    query,
    isSearching,
    matchedIds,
    searchMode,
    setSearchMode,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    searchItems,
    handleSearch,
    searchByImageKeywords,
  }
}

async function semanticSearchWithAI(query: string, items: LostItem[]): Promise<string[]> {
  try {
    console.log('AI Search: Starting semantic search for:', query)
    const results = await semanticSearchItems(query, items)
    console.log('AI Search: Results:', results)
    return results
  } catch (error) {
    console.error('AI semantic search failed, falling back to keyword:', error)
    return simpleKeywordMatch(query, items)
  }
}
