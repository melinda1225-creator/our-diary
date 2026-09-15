import React, { useEffect, useRef, useState } from 'react'

const VIEWPORT = 220
const OUTPUT = 320

export default function AvatarCropper({ file, onCancel, onConfirm }) {
  const [imgEl, setImgEl] = useState(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const bs = Math.max(VIEWPORT / img.width, VIEWPORT / img.height)
      const dispW = img.width * bs
      const dispH = img.height * bs
      setBaseScale(bs)
      setZoom(1)
      setOffset({ x: (VIEWPORT - dispW) / 2, y: (VIEWPORT - dispH) / 2 })
      setImgEl(img)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  function clamp(next, z) {
    if (!imgEl) return next
    const dispW = imgEl.width * baseScale * z
    const dispH = imgEl.height * baseScale * z
    const minX = Math.min(0, VIEWPORT - dispW)
    const minY = Math.min(0, VIEWPORT - dispH)
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    }
  }

  function handleZoomChange(e) {
    const z = Number(e.target.value)
    setZoom(z)
    setOffset((prev) => clamp(prev, z))
  }

  function pointFromEvent(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    return { x: e.clientX, y: e.clientY }
  }

  function startDrag(e) {
    const p = pointFromEvent(e)
    dragRef.current = { startX: p.x, startY: p.y, origin: offset }
  }
  function moveDrag(e) {
    if (!dragRef.current) return
    const p = pointFromEvent(e)
    const dx = p.x - dragRef.current.startX
    const dy = p.y - dragRef.current.startY
    setOffset(clamp({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }, zoom))
  }
  function endDrag() {
    dragRef.current = null
  }

  function handleConfirm() {
    if (!imgEl) return
    const effScale = baseScale * zoom
    const sourceSize = VIEWPORT / effScale
    const sourceX = -offset.x / effScale
    const sourceY = -offset.y / effScale
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    const isPng = file.type === 'image/png'
    if (!isPng) {
      // PNG가 아닌 포맷은 투명도가 없다고 가정하고 흰 배경을 깝니다.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, OUTPUT, OUTPUT)
    }
    ctx.drawImage(imgEl, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT)
    // PNG는 투명도를 그대로 유지하기 위해 PNG로, 그 외에는 용량이 작은 JPEG로 저장합니다.
    onConfirm(isPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div className="cropper-overlay" onClick={onCancel}>
      <div className="cropper-modal card" onClick={(e) => e.stopPropagation()}>
        <p className="cropper-title">보여질 영역을 정해주세요</p>
        <div
          className="cropper-viewport"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onMouseDown={startDrag}
          onMouseMove={moveDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={startDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
        >
          {imgEl && (
            <img
              src={imgEl.src}
              alt="자르기 미리보기"
              draggable={false}
              className="cropper-image"
              style={{
                left: offset.x,
                top: offset.y,
                width: imgEl.width * baseScale * zoom,
                height: imgEl.height * baseScale * zoom,
              }}
            />
          )}
        </div>
        <input
          type="range" min="1" max="3" step="0.01" value={zoom}
          onChange={handleZoomChange} className="cropper-zoom"
        />
        <div className="entry-editor-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={!imgEl}>적용</button>
        </div>
      </div>
    </div>
  )
}
