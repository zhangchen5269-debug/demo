export interface LostItem {
  id: string
  title: string
  description: string
  category: '电子产品' | '证件卡片' | '书籍文具' | '生活用品' | '其他'
  location: string
  date: string
  time: string
  contact: string
  image?: string
  status: '待认领' | '已认领'
  createdAt: string
  color?: string
  features?: string[]
}

export interface LostItemFormData {
  title: string
  description: string
  category: LostItem['category']
  location: string
  date: string
  time: string
  contact: string
  image?: string
  features?: string[]
}
