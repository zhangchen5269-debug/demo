/**
 * MindLink API 代理 — Cloudflare Worker
 *
 * 作用：安全地代理智谱 GLM API 请求，API Key 存储在 Worker 环境变量中，
 * 不会暴露给前端浏览器。
 *
 * 部署方式：
 * 1. npm install -g wrangler
 * 2. wrangler login
 * 3. wrangler secret put GLM_API_KEY
 *    （输入: be536801f6fe422ca3771ddea9e84064.8l6MDeTHvQudpOPF）
 * 4. wrangler deploy
 * 5. 将返回的 Worker URL 设置到前端 .env 的 VITE_API_PROXY_URL
 */

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed' }),
        {
          status: 405,
          headers: corsHeaders(),
        }
      )
    }

    try {
      const body = await request.json()

      // 转发请求到智谱 GLM API
      const glmResponse = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.GLM_API_KEY}`,
          },
          body: JSON.stringify(body),
        }
      )

      const data = await glmResponse.text()

      return new Response(data, {
        status: glmResponse.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(),
        },
      })
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: '代理请求失败，请稍后重试',
          detail: error.message,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(),
          },
        }
      )
    }
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
