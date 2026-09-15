import React, { useRef, useState } from 'react'
import AvatarCropper from './AvatarCropper.jsx'

export default function AvatarPicker({ value, fallbackColor, fallbackInitial, onChange }) {
  const inputRef = useRef(null)
  const [pendingFile, setPendingFile] = useState(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-preview" style={{ background: value ? 'transparent' : fallbackColor }}>
        {value ? <img src={value} alt="프로필 사진" /> : <span>{fallbackInitial}</span>}
      </div>
      <div className="avatar-picker-actions">
        <label className="btn btn-small">
          사진 선택
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} hidden />
        </label>
        {value && <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange(null)}>제거</button>}
      </div>

      {pendingFile && (
        <AvatarCropper
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={(dataUrl) => { onChange(dataUrl); setPendingFile(null) }}
        />
      )}
    </div>
  )
}
