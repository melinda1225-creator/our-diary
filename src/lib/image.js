// 댓글에 첨부하는 이미지를 GitHub 레포에 커밋하기 전에
// 적당한 크기로 줄여서 base64로 변환합니다. (레포 용량 절약 + API 페이로드 제한 회피)

const MAX_WIDTH = 900
const JPEG_QUALITY = 0.82

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 이미지 파일을 리사이즈하여 { base64, mime, extension } 형태로 반환합니다.
 * base64는 data URL 접두어(data:image/png;base64,)가 제거된 순수 값입니다.
 */
export async function resizeImageFile(file) {
  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImage(dataUrl)

  const scale = Math.min(1, MAX_WIDTH / img.width)
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const isGif = file.type === 'image/gif'
  // gif는 리사이즈 시 애니메이션이 깨지므로 원본을 그대로 사용합니다.
  if (isGif) {
    const base64 = dataUrl.split(',')[1]
    return { base64, mime: 'image/gif', extension: 'gif' }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const isPng = file.type === 'image/png'
  if (!isPng) {
    // PNG가 아닌 포맷은 투명도가 없다고 가정하고 흰 배경을 깐 뒤 JPEG로 압축해서 용량을 아낍니다.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)

  if (isPng) {
    // PNG는 투명도를 그대로 유지하기 위해 PNG로 저장합니다. (JPEG는 투명도를 지원하지 않음)
    const outDataUrl = canvas.toDataURL('image/png')
    const base64 = outDataUrl.split(',')[1]
    return { base64, mime: 'image/png', extension: 'png' }
  }

  const mime = 'image/jpeg'
  const outDataUrl = canvas.toDataURL(mime, JPEG_QUALITY)
  const base64 = outDataUrl.split(',')[1]
  return { base64, mime, extension: 'jpg' }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 프로필 사진용: 정사각형으로 크롭 + 축소해서 data URL(문자열) 그대로 반환합니다.
 * config.json에 직접 저장할 수 있도록 별도 파일 업로드 없이 문자열 하나로 처리합니다.
 */
export async function resizeAvatarToDataUrl(file, size = 160) {
  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImage(dataUrl)

  const side = Math.min(img.width, img.height)
  const sx = (img.width - side) / 2
  const sy = (img.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const isPng = file.type === 'image/png'
  if (!isPng) {
    // PNG가 아닌 포맷은 투명도가 없다고 가정하고 흰 배경을 깝니다.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
  }
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  // PNG는 투명도를 그대로 유지하기 위해 PNG로, 그 외에는 용량이 작은 JPEG로 저장합니다.
  return isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85)
}

// 커스텀 반응(스티커) 이미지도 같은 방식(정사각형 크롭+축소)을 재사용합니다.
export const resizeStickerToDataUrl = resizeAvatarToDataUrl
