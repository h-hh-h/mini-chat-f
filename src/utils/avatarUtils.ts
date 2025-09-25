/**
 * 生成基于昵称的默认头像 SVG 数据 URL
 * @param nickname 用户昵称
 * @param size 头像尺寸
 * @returns SVG 数据 URL
 */
export function generateNicknameAvatar(nickname?: string, size: number = 40): string {
  // 默认昵称首字母
  const initials = getInitials(nickname)
  
  // 生成背景颜色
  const backgroundColor = generateBackgroundColor(nickname)
  
  // 生成文字颜色
  const textColor = getTextColor(backgroundColor)
  
  // 创建 SVG 字符串
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${backgroundColor}" rx="4"/>
      <text x="20" y="20" fill="${textColor}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="central">
        ${initials}
      </text>
    </svg>
  `.trim()
  
  // 转换为数据 URL
  return `data:image/svg+xml,${encodeURIComponent(svgString)}`
}

/**
 * 获取昵称首字母
 * @param nickname 昵称
 * @returns 首字母或默认字符
 */
function getInitials(nickname?: string): string {
  if (!nickname) return '?'
  
  // 获取第一个字符
  const firstChar = nickname.charAt(0)
  // 检查是否为字母、数字或中文字符
  return /^[\w\u4e00-\u9fa5]$/.test(firstChar) ? firstChar.toUpperCase() : '?'
}

/**
 * 根据昵称生成背景颜色
 * @param nickname 昵称
 * @returns 颜色值
 */
function generateBackgroundColor(nickname?: string): string {
  if (!nickname) return '#cccccc'
  
  // 生成哈希值
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // 生成 HSL 颜色，确保颜色明亮且饱和度适中
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 70%, 60%)`
}

/**
 * 根据背景色确定文字颜色
 * @param backgroundColor 背景色
 * @returns 文字颜色
 */
function getTextColor(backgroundColor: string): string {
  // 解析 HSL 颜色值
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (hslMatch) {
    const lightness = parseInt(hslMatch[3])
    return lightness > 60 ? '#333333' : '#ffffff'
  }
  return '#ffffff'
}