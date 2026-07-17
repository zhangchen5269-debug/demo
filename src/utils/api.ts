// ============================================================
// MindLink API 层 — 统一通过代理调用智谱 GLM 平台
//
// 架构: 浏览器 → Cloudflare Worker (代理) → 智谱 GLM API
// Worker 持有 API Key，前端代码中没有任何密钥。
//
// 模型分工：
//   glm-4.7（旗舰文本）→ 解析、描述、搜索、匹配等文字任务
//   glm-4.6v-flash（免费多模态）→ 图片识别和图片搜索
// ============================================================

/** 代理地址：部署 Cloudflare Worker 后替换为实际 URL */
const API_PROXY_URL =
  import.meta.env.VITE_API_PROXY_URL || 'http://localhost:8787'

/** 文本模型（GLM-4.7 旗舰，速率限制宽松，¥2/¥8 每百万 token） */
const TEXT_MODEL = 'glm-4.7'
/** 多模态模型（免费，支持图片） */
const VISION_MODEL = 'glm-4.6v-flash'

// ---- 类型定义 ----

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MultimodalContent[]
}

interface MultimodalContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
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

// ---- 通用 API 调用 ----

interface GLMCallOptions {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
  /** 覆盖默认文本模型，例如图片任务传 VISION_MODEL */
  model?: string
}

async function callGLMAPI(options: GLMCallOptions): Promise<string> {
  // 节流：确保两次调用之间至少间隔 2 秒
  await throttleWait()

  const { messages, temperature = 0.7, maxTokens = 2000, responseFormat, model } = options

  const body: Record<string, unknown> = {
    model: model || TEXT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  }

  if (responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(API_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()

    // 429 速率限制 → 给出友好提示
    if (response.status === 429) {
      throw new Error('请求太频繁，请稍后再试')
    }

    throw new Error(
      `API 请求失败: ${response.status} ${response.statusText} — ${errorText}`
    )
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`代理层错误: ${data.error} — ${data.detail || ''}`)
  }

  return data.choices?.[0]?.message?.content || '未获取到有效响应'
}

// ---- 文本解析 Prompt ----

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

// ---- 对外 API ----

/** 从自然语言文本中解析失物信息 */
export async function parseLostItem(text: string): Promise<ParsedLostItem> {
  try {
    const content = await callGLMAPI({
      messages: [
        { role: 'system', content: PARSE_LOST_ITEM_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      maxTokens: 800,
      responseFormat: 'json_object',
    })

    let parsed: ParsedLostItem
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('JSON 解析失败')
      throw new Error('解析失物信息失败，请重试')
    }

    const today = new Date().toISOString().split('T')[0]
    const validCategories: ParsedLostItem['category'][] = [
      '电子产品',
      '证件卡片',
      '书籍文具',
      '生活用品',
      '其他',
    ]

    return {
      title: parsed.title || '未知物品',
      description: parsed.description || '请补充物品描述',
      category: validCategories.includes(parsed.category)
        ? parsed.category
        : '其他',
      location: parsed.location || '未知地点',
      date: parsed.date || today,
      time: parsed.time || '12:00',
      contact: parsed.contact || '请联系失物招领处',
    }
  } catch (error) {
    console.error('解析失物信息失败:', error)
    throw error
  }
}

/** 根据物品名称和地点生成一段友好的失物描述 */
export async function generateSmartDescription(
  itemName: string,
  location: string
): Promise<string> {
  const systemPrompt = `你是一个校园失物招领助手。请根据物品名称和丢失地点，生成一段详细、友好的失物描述。描述应该包括：
1. 物品的基本特征
2. 可能的品牌或型号
3. 物品的状态或包装
4. 其他有助于识别的细节

请用简洁、易懂的语言描述，控制在100字以内。`

  return callGLMAPI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `物品名称：${itemName}\n丢失地点：${location}\n\n请生成一段描述：` },
    ],
    temperature: 0.7,
    maxTokens: 500,
  })
}

/** 从失物描述中提取 3-5 个搜索关键词 */
export async function suggestSearchKeywords(
  description: string
): Promise<string[]> {
  const systemPrompt = `你是一个智能搜索助手。请根据失物描述，提取3-5个最有用的搜索关键词。关键词应该包括：
1. 物品名称
2. 品牌或型号（如果有）
3. 显著特征
4. 颜色或尺寸（如果有）

请只返回关键词，用逗号分隔，不要包含其他文字。`

  const response = await callGLMAPI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ],
    temperature: 0.5,
    maxTokens: 300,
  })

  return response
    .split(/[,，]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
}

/** AI 语义匹配：在候选物品列表中找出与目标物品最匹配的 */
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

  const response = await callGLMAPI({
    messages: [{ role: 'system', content: systemPrompt }],
    temperature: 0.3,
    maxTokens: 800,
  })

  try {
    return JSON.parse(response)
  } catch {
    console.error('解析匹配结果失败')
    return []
  }
}

// ---- AI 语义搜索 ----

export interface LostItemForSearch {
  id: string
  title: string
  description: string
  location: string
}

/**
 * AI 语义搜索：根据用户查询在失物列表中找出最匹配的物品
 * 返回匹配的物品 ID 列表（最多 3 个，按匹配度降序）
 */
export async function semanticSearchItems(
  query: string,
  items: LostItemForSearch[]
): Promise<string[]> {
  const content = await callGLMAPI({
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

搜索任何物品时：
- 物品名称完全匹配或高度相关：80-100分
- 物品名称部分匹配（如搜索"耳机"，物品名是"苹果耳机"）：70-90分
- 只有地点匹配（搜索"耳机"，物品是"图书馆的书"）：0分
- 只有类别匹配：50-60分

【严格禁止】
- 不能因为查询和物品都在"图书馆"就认为匹配
- 不能因为查询有"耳机"就匹配任何带"耳"字的物品

【物品列表】
${items.map((item) => `ID:${item.id} | 名称:${item.title} | 描述:${item.description} | 地点:${item.location}`).join('\n')}

【用户查询】
${query}

请严格按评分标准判断，只返回真正匹配的物品ID。`,
      },
      {
        role: 'user',
        content: '请分析用户查询与物品列表的匹配度，返回Top 3的物品ID和分数',
      },
    ],
    temperature: 0.3,
    maxTokens: 500,
    responseFormat: 'json_object',
  })

  try {
    const result = JSON.parse(content)
    const matches = result.matches || result.Matches || []
    const validItemIds = new Set(items.map((item) => item.id))

    return matches
      .filter(
        (m: { id?: string; score?: number }) =>
          m &&
          typeof m.id === 'string' &&
          validItemIds.has(m.id) &&
          (m.score ?? 0) >= 60
      )
      .slice(0, 3)
      .map((m: { id: string }) => m.id)
  } catch {
    console.error('AI 语义搜索 JSON 解析失败')
    return []
  }
}

// ---- 图片识别（多模态） ----

/**
 * 使用多模态模型分析图片，返回完整的失物登记信息
 */
export async function analyzeImageForRegistration(
  imageBase64: string
): Promise<ImageRegistrationResult> {
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
    const content = await callGLMAPI({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            {
              type: 'image_url',
              image_url: { url: processedImage },
            },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 1000,
      model: VISION_MODEL,
    })

    // 尝试从返回内容中提取 JSON
    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    let parsed: ImageRegistrationResult
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('JSON 解析失败，返回默认值')
      return {
        title: '识别失败，请手动填写',
        description: '请手动描述物品特征',
        category: '其他',
        location: '',
        date: today,
        time: now,
        contact: '请联系失物招领处',
        color: '',
        features: [],
      }
    }

    const validCategories: ImageRegistrationResult['category'][] = [
      '电子产品',
      '证件卡片',
      '书籍文具',
      '生活用品',
      '其他',
    ]

    return {
      title: parsed.title || '未知物品',
      description: parsed.description || '请补充物品描述',
      category: validCategories.includes(parsed.category)
        ? parsed.category
        : '其他',
      location: parsed.location || '',
      date: parsed.date || today,
      time: parsed.time || '12:00',
      contact: parsed.contact || '请联系失物招领处',
      color: parsed.color || '',
      features: parsed.features || [],
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '图片分析失败'
    console.error('图片分析失败:', msg)
    throw new Error(msg || '图片分析失败，请重试')
  }
}

/**
 * 使用多模态模型分析图片，返回用于搜索的描述文本
 */
export async function analyzeLostItemImage(
  imageBase64: string
): Promise<ImageAnalysisResult> {
  let processedImage = imageBase64
  if (!imageBase64.startsWith('data:')) {
    processedImage = `data:image/jpeg;base64,${imageBase64}`
  }

  try {
    const content = await callGLMAPI({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '分析这张校园失物图片，返回 JSON（不要其他文字）：\n{\n  "itemType": "物品类型关键词（如：耳机、水杯、钥匙、书包，2-4字）",\n  "color": "主要颜色（如：黑色、蓝色、银色）",\n  "features": ["特征1", "特征2", "特征3"],\n  "description": "一句话描述"\n}\n只输出物品本身的特征，不要编造失主信息。',
            },
            {
              type: 'image_url',
              image_url: { url: processedImage },
            },
          ],
        },
      ],
      temperature: 0.3,
      maxTokens: 300,
      model: VISION_MODEL,
    })

    // 尝试按 JSON 解析，失败就当纯文本描述
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = JSON.parse(content)
    } catch {
      // 纯文本描述，正常情况
    }

    if (parsed) {
      return {
        description:
          (parsed.description as string) ||
          (parsed.描述 as string) ||
          content,
        suggestedSearchTerms:
          (parsed.suggestedSearchTerms as string[]) ||
          (parsed.建议搜索词 as string[]) ||
          [],
        itemType:
          (parsed.itemType as string) ||
          (parsed.物品类型 as string) ||
          '其他',
        color:
          (parsed.color as string) || (parsed.颜色 as string) || '',
        features:
          (parsed.features as string[]) ||
          (parsed.特征 as string[]) ||
          [],
      }
    }

    return {
      description: content,
      suggestedSearchTerms: [],
      itemType: extractItemType(content),
      color: extractColor(content),
      features: [],
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '图片分析失败'
    console.error('图片分析失败:', msg)
    throw new Error(msg || '图片分析失败，请重试')
  }
}

// ---- 辅助函数 ----

function extractItemType(text: string): string {
  const keywords = [
    '手机', '耳机', '钱包', '钥匙', '身份证', '学生证', '银行卡',
    '书籍', '笔记本', '水杯', '书包', '背包', '雨伞', '充电宝',
    '数据线', 'U盘', '手表', '眼镜', '帽子', '围巾', '手套',
    '衣服', '鞋子', '卡片',
  ]
  for (const keyword of keywords) {
    if (text.includes(keyword)) return keyword
  }
  return '其他'
}

function extractColor(text: string): string {
  const colors = [
    '黑色', '白色', '银色', '金色', '蓝色', '红色', '绿色',
    '黄色', '橙色', '紫色', '粉色', '棕色', '灰色',
  ]
  for (const color of colors) {
    if (text.includes(color)) return color
  }
  return ''
}

/** 从图片分析结果生成搜索查询文本（只提取关键字） */
export function generateSearchQueryFromImageAnalysis(
  result: ImageAnalysisResult
): string {
  const keywords: string[] = []

  // 物品类型
  if (result.itemType && result.itemType !== '未知' && result.itemType !== '其他') {
    keywords.push(result.itemType)
  }

  // 颜色
  if (result.color && result.color !== '未知') {
    keywords.push(result.color)
  }

  // 特征关键词
  if (result.features && result.features.length > 0) {
    keywords.push(...result.features.slice(0, 4))
  }

  // 兜底：提取描述中前几个词
  if (keywords.length === 0) {
    return result.description.trim().slice(0, 30)
  }

  return keywords.join(' ')
}

// ---- AI 健康检查 ----

export type AIStatus = 'online' | 'degraded' | 'offline' | 'checking'

/**
 * 检测 AI 服务是否可用（OPTIONS 预检不消耗 API 额度）
 * - online: 代理可达
 * - offline: 代理不可达
 */
export async function checkAIHealth(): Promise<AIStatus> {
  try {
    const response = await fetch(API_PROXY_URL, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok || response.status === 204) return 'online'
    return 'offline'
  } catch {
    return 'offline'
  }
}

// ---- 请求节流 ----

let lastAPICallTime = 0
const MIN_INTERVAL_MS = 2000 // 两次 API 调用最小间隔 2 秒

async function throttleWait(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastAPICallTime
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed))
  }
  lastAPICallTime = Date.now()
}
