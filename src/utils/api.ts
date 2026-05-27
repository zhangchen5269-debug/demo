const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

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
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
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
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
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
