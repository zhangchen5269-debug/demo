import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { LostItem, LostItemFormData } from '../types/lostItem'

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
    const searchText = `${titleLower} ${descriptionLower} ${locationLower}`
    
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
          const matches = simpleKeywordMatch(searchQuery, items)
          console.log('Fallback keyword matches:', matches)
          setMatchedIds(matches)
        }
        setIsSearching(false)
      }
    }, 500)
  }, [items, searchMode])

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
  }
}

async function semanticSearchWithAI(query: string, items: LostItem[]): Promise<string[]> {
  const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
  
  if (!DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API Key not configured, using keyword search')
    return simpleKeywordMatch(query, items)
  }

  try {
    console.log('AI Search: Starting semantic search for:', query)
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个智能失物招领搜索助手。用户输入了查询，你需要判断这个查询与候选失物列表的匹配程度。

【核心规则】
1. 只返回JSON对象，不要包含其他文字
2. 返回匹配度最高的Top 3物品ID，按匹配度从高到低排序
3. JSON格式：{"matches": [{"id": "物品ID", "score": 0-100的分数}]}
4. 【最重要】只返回物品列表中真实存在的物品ID，绝对不要编造任何ID！

【评分标准】
搜索"蓝牙耳机"时：
- 物品名称包含"蓝牙耳机"或"耳机"：80-100分
- 物品名称包含"图书馆"但不含"耳机"相关词：0分（不匹配）
- 物品描述中提到"图书馆"但不提"耳机"：0分

搜索任何物品时：
- 物品名称完全匹配或高度相关：80-100分
- 物品名称部分匹配（如搜索"耳机"，物品名是"苹果耳机"）：70-90分
- 只有地点匹配（搜索"耳机"，物品是"图书馆的书"）：0分
- 只有类别匹配：50-60分

【严格禁止】
- 不能因为查询和物品都在"图书馆"就认为匹配
- 不能因为查询有"耳机"就匹配任何带"耳"字的物品
- 不能因为查询有"手机"就匹配任何物品
- 不能因为查询有"书"就匹配所有书籍类物品

【物品列表】
${items.map(item => `ID:${item.id} | 名称:${item.title} | 描述:${item.description} | 地点:${item.location}`).join('\n')}

【用户查询】
${query}

请严格按评分标准判断，只返回真正匹配的物品ID。`
          },
          {
            role: 'user',
            content: `请分析用户查询与物品列表的匹配度，返回Top 3的物品ID和分数`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Search: API request failed:', response.status, errorText)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    console.log('AI Search: Response content:', content)
    
    if (!content) {
      console.warn('AI Search: Empty response content, falling back to keyword')
      return simpleKeywordMatch(query, items)
    }

    try {
      const result = JSON.parse(content)
      console.log('AI Search: Parsed result:', result)
      
      const matches = result.matches || result.Matches || []
      console.log('AI Search: Matches array:', matches)
      
      // 过滤无效的 ID，只保留存在的物品 ID
      const validItemIds = items.map(item => item.id)
      console.log('AI Search: Valid item IDs:', validItemIds)
      
      const filteredMatches = matches
        .filter((m: any) => {
          if (!m || typeof m.id !== 'string') {
            console.log('AI Search: Filtering out invalid match (bad format):', m)
            return false
          }
          if (!validItemIds.includes(m.id)) {
            console.log('AI Search: Filtering out invalid match (ID not found):', m)
            return false
          }
          if (m.score < 60) {
            console.log('AI Search: Filtering out invalid match (score too low):', m)
            return false
          }
          return true
        })
        .slice(0, 3)
        .map((m: any) => m.id)
      
      console.log('AI Search: Final valid matches:', filteredMatches)
      return filteredMatches
      
    } catch (parseError) {
      console.error('AI Search: Failed to parse JSON:', parseError)
      return simpleKeywordMatch(query, items)
    }

  } catch (error) {
    console.error('Semantic search failed:', error)
    return simpleKeywordMatch(query, items)
  }
}
