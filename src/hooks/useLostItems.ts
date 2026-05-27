import { useMemo } from 'react'
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

export function useLostItems() {
  const [items, setItems] = useLocalStorage<LostItem[]>('mindlink-lost-items', SAMPLE_ITEMS)

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

  const searchItems = (query: string) => {
    const lowerQuery = query.toLowerCase()
    return items.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.location.toLowerCase().includes(lowerQuery)
    )
  }

  const filteredItems = useMemo(() => {
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items])

  return {
    items: filteredItems,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    searchItems,
  }
}
