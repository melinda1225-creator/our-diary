import React from 'react'
import RemoteImage from './RemoteImage.jsx'

export default function Lightbox({ path, onClose }) {
  if (!path) return null
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="닫기">✕</button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <RemoteImage path={path} className="lightbox-image" />
      </div>
    </div>
  )
}
