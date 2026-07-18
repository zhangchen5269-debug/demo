import { useMemo } from 'react'
import { motion } from 'framer-motion'

const IMAGE_COUNT = 7
const COLS = 7   // 网格列数
const ROWS = 5   // 网格行数（7×5 = 35，正好覆盖全屏）

// Fisher-Yates 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface ImageConfig {
  id: string
  src: string
  x: number
  y: number
  rotation: number
  size: number
  opacity: number
  delay: number
}

function generateConfigs(): ImageConfig[] {
  // 生成 35 个网格单元格，每格一张图，先铺满再微调
  const cells: { col: number; row: number }[] = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      cells.push({ col, row })
    }
  }

  // 随机打乱单元格顺序，让不同图片随机分布
  const shuffled = shuffle(cells)

  return shuffled.map(({ col, row }, index) => {
    const imgIndex = index % IMAGE_COUNT
    const cellW = 100 / COLS   // 每格宽度 %
    const cellH = 100 / ROWS   // 每格高度 %

    // 在单元格内随机偏移 ±35%，允许少量跨格叠加，但不会严重重叠
    const jitterX = (Math.random() - 0.5) * cellW * 0.7
    const jitterY = (Math.random() - 0.5) * cellH * 0.7

    return {
      id: `bg-${imgIndex + 1}-${index}`,
      src: `${import.meta.env.BASE_URL}bg-images/bg-${imgIndex + 1}.jpg`,
      x: (col + 0.5) * cellW + jitterX,      // 格中心 + 随机抖动
      y: (row + 0.5) * cellH + jitterY,
      rotation: Math.random() * 360,
      size: 100 + Math.random() * 180,        // 100–280px
      opacity: 0.15 + Math.random() * 0.2,    // 0.15–0.35
      delay: (col + row) * 0.03 + Math.random() * 0.4,
    }
  })
}

export default function BackgroundDecorations() {
  const configs = useMemo(() => generateConfigs(), [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 保留原有的柔和光晕 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ duration: 1.5 }}
        className="absolute -top-32 -right-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-deep/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 1.5, delay: 0.6 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-bg-subdued rounded-full blur-3xl"
      />

      {/* 随机散布的背景图片 */}
      {configs.map((cfg) => (
        <motion.img
          key={cfg.id}
          src={cfg.src}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: cfg.opacity }}
          transition={{ duration: 2, delay: cfg.delay, ease: 'easeOut' }}
          className="absolute"
          style={{
            left: `${cfg.x}%`,
            top: `${cfg.y}%`,
            width: `${cfg.size}px`,
            height: 'auto',
            transform: `translate(-50%, -50%) rotate(${cfg.rotation}deg)`,
            filter: 'blur(0.5px)',
            borderRadius: '4px',
          }}
        />
      ))}
    </div>
  )
}
