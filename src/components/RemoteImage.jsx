import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const imageCache = new Map()

export default function RemoteImage({ path, className, alt }) {
  const auth = useAuth()
  const [src, setSrc] = useState(imageCache.get(path) || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setSrc(imageCache.get(path) || null)
    setError(false)
    if (!path || imageCache.has(path)) return
    let cancelled = false
    auth.client
      .getBase64File(path)
      .then((base64) => {
        if (cancelled || !base64) return
        const mime = guessMime(path)
        const dataUrl = `data:${mime};base64,${base64}`
        imageCache.set(path, dataUrl)
        setSrc(dataUrl)
      })
      .catch(() => !cancelled && setError(true))
    return () => { cancelled = true }
  }, [path])

  if (!path) return null
  if (error) return <p className="comment-image-error">이미지를 불러오지 못했어요.</p>
  if (!src) return <div className={`${className || ''} skeleton`} />
  return <img className={className} src={src} alt={alt || '첨부 이미지'} loading="lazy" />
}

function guessMime(path) {
  if (path.endsWith('.gif')) return 'image/gif'
  if (path.endsWith('.png')) return 'image/png'
  return 'image/jpeg'
}
