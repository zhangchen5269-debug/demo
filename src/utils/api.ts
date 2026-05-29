// DeepSeek API 配置
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// 智谱 GLM API 配置（仅用于图片识别）
const GLM_API_KEY = import.meta.env.VITE_GLM_API_KEY || 'be536801f6fe422ca3771ddea9e84064.8l6MDeTHvQudpOPF'
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ParsedLostItem {
  title: string
  description: string
  category: '电子产品' | '证件卡片' | '书籍文具' | '生活用品' | '其他'
  location: string
  date: string
  time: string
  contact: string
}

async function callDeepSeekAPI(messages: DeepSeekMessage[]): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置。请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY')
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '未获取到有效响应'
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error)
    throw error
  }
}

const PARSE_LOST_ITEM_SYSTEM_PROMPT = `你是一个专业的校园失物信息解析助手。你的任务是从用户提供的文本中提取失物的关键信息，并以严格的 JSON 格式返回。

要求：
1. 只返回 JSON，不要包含任何其他文本、解释、备注或 Markdown 格式
2. 确保 JSON 格式完全正确，无语法错误
3. 所有字符串字段不能为空，至少要有默认值
4. 日期格式必须是 YYYY-MM-DD
5. 时间格式必须是 HH:MM
6. 如果某些信息无法确定，使用合理的默认值

返回格式要求（严格遵循）：
{
  "title": "物品名称（简洁明了，包含关键特征）",
  "description": "物品描述（100字以内，包含颜色、品牌、型号等特征）",
  "category": "分类（必须是：电子产品 | 证件卡片 | 书籍文具 | 生活用品 | 其他）",
  "location": "丢失地点",
  "date": "丢失日期（YYYY-MM-DD 格式，如果无法确定，使用今天的日期）",
  "time": "丢失时间（HH:MM 格式，如果无法确定，使用 '12:00'）",
  "contact": "联系方式（如果无法确定，使用 '请联系失物招领处'）"
}

分类规则：
- 电子产品：手机、电脑、耳机、充电器、U盘等电子设备
- 证件卡片：身份证、学生证、银行卡、校园卡等
- 书籍文具：书籍、笔记本、笔、尺子等学习用品
- 生活用品：钱包、钥匙、水杯、衣物、雨伞等日常用品
- 其他：不属于以上类别的物品

重要提示：
- 不要返回任何其他内容，只返回符合格式的 JSON
- 如果用户没有明确提供某个字段，根据上下文合理推断或使用默认值
- 确保所有字段都有有效值，不要留空字符串
- 使用中文输出所有字段内容`

export async function parseLostItem(text: string): Promise<ParsedLostItem> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置。请在 .env 文件中设置 VITE_DEEPSEEK_API_KEY')
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
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
            content: PARSE_LOST_ITEM_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('未获取到有效响应')
    }

    let parsed: ParsedLostItem
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError)
      throw new Error('解析失物信息失败，请重试')
    }

    const today = new Date().toISOString().split('T')[0]
    return {
      title: parsed.title || '未知物品',
      description: parsed.description || '请补充物品描述',
      category: ['电子产品', '证件卡片', '书籍文具', '生活用品', '其他'].includes(parsed.category)
        ? parsed.category as any
        : '其他',
      location: parsed.location || '未知地点',
      date: parsed.date || today,
      time: parsed.time || '12:00',
      contact: parsed.contact || '请联系失物招领处'
    }
  } catch (error) {
    console.error('解析失物信息失败:', error)
    throw error
  }
}

export async function generateSmartDescription(itemName: string, location: string): Promise<string> {
  const systemPrompt = `你是一个校园失物招领助手。请根据物品名称和丢失地点，生成一段详细、友好的失物描述。描述应该包括：
1. 物品的基本特征
2. 可能的品牌或型号
3. 物品的状态或包装
4. 其他有助于识别的细节

请用简洁、易懂的语言描述，控制在100字以内。`

  const userMessage = `物品名称：${itemName}\n丢失地点：${location}\n\n请生成一段描述：`

  const response = await callDeepSeekAPI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ])

  return response
}

export async function suggestSearchKeywords(description: string): Promise<string[]> {
  const systemPrompt = `你是一个智能搜索助手。请根据失物描述，提取3-5个最有用的搜索关键词。关键词应该包括：
1. 物品名称
2. 品牌或型号（如果有）
3. 显著特征
4. 颜色或尺寸（如果有）

请只返回关键词，用逗号分隔，不要包含其他文字。`

  const response = await callDeepSeekAPI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: description },
  ])

  return response.split('，').map(k => k.trim()).filter(k => k.length > 0)
}

export async function matchLostItems(
  targetItem: { title: string; description: string },
  candidateItems: Array<{ id: string; title: string; description: string }>
): Promise<Array<{ id: string; score: number; reason: string }>> {
  const systemPrompt = `你是一个智能匹配助手。请判断目标失物与候选失物列表中每个物品的匹配程度。
  
目标物品：${targetItem.title} - ${targetItem.description}
  
候选物品列表：
${candidateItems.map((item, i) => `${i + 1}. ${item.title} - ${item.description}`).join('\n')}
  
请按匹配度从高到低排序，返回JSON数组格式：
[{"id": "物品ID", "score": 0-100的分数, "reason": "匹配原因"}]

只返回JSON数组，不要包含其他文字。`

  const response = await callDeepSeekAPI([
    { role: 'system', content: systemPrompt },
  ])

  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('解析匹配结果失败:', error)
    return []
  }
}

export interface ImageAnalysisResult {
   description: string
   suggestedSearchTerms: string[]
   itemType: string
   color: string
   features: string[]
 }

export interface ImageRegistrationResult {
  title: string
  description: string
  category: '电子产品' | '证件卡片' | '书籍文具' | '生活用品' | '其他'
  location: string
  date: string
  time: string
  contact: string
  color: string
  features: string[]
}

/**
 * 使用 GLM-4.6V 模型识别图片并填充失物表单（仅图片识别使用 GLM）
 */
export async function analyzeImageForRegistration(imageBase64: string): Promise<ImageRegistrationResult> {
  let processedImage = imageBase64
  if (!imageBase64.startsWith('data:')) {
    processedImage = `data:image/jpeg;base64,${imageBase64}`
  }

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toTimeString().slice(0, 5)

  const systemPrompt = `你是一个专业的校园失物图片识别助手。请分析用户上传的图片，识别失物信息并返回 JSON。

要求：
1. 只返回严格的 JSON 格式，不要其他文字
2. 确保 JSON 格式正确，无语法错误
3. 所有字段有合理值，无法确定的用空字符串或默认值

返回字段：
{
  "title": "物品标题（简洁，含关键特征）",
  "description": "物品描述（100字内，含颜色、品牌、型号等）",
  "category": "分类（电子产品|证件卡片|书籍文具|生活用品|其他）",
  "location": "丢失地点（如无法确定，填空）",
  "date": "丢失日期（YYYY-MM-DD，无法确定填今天）",
  "time": "丢失时间（HH:MM，无法确定填12:00）",
  "contact": "联系方式（图片中有则提取，否则填'请联系失物招领处'）",
  "color": "物品颜色（从图片识别）",
  "features": "物品特征数组（如['全新','有划痕']）"
}

分类规则：
- 电子产品：手机、电脑、耳机、充电器、U盘、手表等
- 证件卡片：身份证、学生证、银行卡、校园卡、钥匙等
- 书籍文具：书籍、笔记本、笔、尺子、计算器等
- 生活用品：钱包、水杯、衣物、雨伞、书包等
- 其他：不属于以上类别的物品

重要：
- 仔细识别图片中的文字信息，如姓名、学号、电话号码等可能是联系方式
- 从图片中提取物品颜色、材质、品牌、型号等特征
- 图片中有品牌标志或文字要提取到描述中
- 使用中文输出`

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.6V',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: systemPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: processedImage
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        stream: false
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 请求失败:', response.status, errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('未获取到有效响应')
    }

    let jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      content = jsonMatch[0]
    }

    let parsed: ImageRegistrationResult
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON 解析失败，返回默认值:', parseError)
      return {
        title: '识别失败，请手动填写',
        description: '请手动描述物品特征',
        category: '其他',
        location: '',
        date: today,
        time: now,
        contact: '请联系失物招领处',
        color: '',
        features: []
      }
    }

    const validCategories = ['电子产品', '证件卡片', '书籍文具', '生活用品', '其他']
    return {
      title: parsed.title || '未知物品',
      description: parsed.description || '请补充物品描述',
      category: validCategories.includes(parsed.category) ? parsed.category : '其他',
      location: parsed.location || '',
      date: parsed.date || today,
      time: parsed.time || '12:00',
      contact: parsed.contact || '请联系失物招领处',
      color: parsed.color || '',
      features: parsed.features || []
    }
  } catch (error: any) {
    console.error('图片分析失败:', error)
    throw new Error(error.message || '图片分析失败，请重试')
  }
}

export async function analyzeLostItemImage(imageBase64: string): Promise<ImageAnalysisResult> {
  let processedImage = imageBase64
  if (!imageBase64.startsWith('data:')) {
    processedImage = `data:image/jpeg;base64,${imageBase64}`
  }

  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.6V',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '这是一张校园失物图片，请仔细分析图片中的物品，包括：物品类型、主要颜色、材质、显著特征、品牌、文字信息等。输出一段清晰、自然、适合用于失物招领搜索的描述文本。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: processedImage
                }
              }
            ]
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
        stream: false
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 请求失败:', response.status, errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('未获取到有效响应')
    }

    let parsed: any = null
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.log('图片分析返回纯文本描述，直接使用')
    }

    if (parsed) {
      return {
        description: parsed.description || parsed.描述 || content,
        suggestedSearchTerms: parsed.suggestedSearchTerms || parsed.建议搜索词 || [],
        itemType: parsed.itemType || parsed.物品类型 || '其他',
        color: parsed.color || parsed.颜色 || '',
        features: parsed.features || parsed.特征 || []
      }
    } else {
      return {
        description: content,
        suggestedSearchTerms: [],
        itemType: extractItemType(content),
        color: extractColor(content),
        features: []
      }
    }
  } catch (error: any) {
    console.error('图片分析失败:', error)
    throw new Error(error.message || '图片分析失败，请重试')
  }
}
 
 function extractItemType(text: string): string {
   const keywords = ['手机', '耳机', '钱包', '钥匙', '身份证', '学生证', '银行卡', '书籍', '笔记本', '水杯', '书包', '背包', '雨伞', '钥匙', '充电宝', '数据线', 'U盘', '手表', '眼镜', '帽子', '围巾', '手套', '衣服', '鞋子', '钱包', '卡片']
   for (const keyword of keywords) {
     if (text.includes(keyword)) {
       return keyword
     }
   }
   return '其他'
 }
 
 function extractColor(text: string): string {
   const colors = ['黑色', '白色', '银色', '金色', '蓝色', '红色', '绿色', '黄色', '橙色', '紫色', '粉色', '棕色', '灰色']
   for (const color of colors) {
     if (text.includes(color)) {
       return color
     }
   }
   return ''
 }

export function generateSearchQueryFromImageAnalysis(result: ImageAnalysisResult): string {
  return result.description.trim()
}
