import React, { useState } from 'react'

function normalizeTag(raw) {
  const trimmed = raw.trim().replace(/^#+/, '')
  if (!trimmed) return null
  return `#${trimmed}`
}

export default function HashtagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  function commitDraft() {
    const tag = normalizeTag(draft)
    setDraft('')
    if (!tag) return
    if (value.includes(tag)) return
    onChange([...value, tag])
  }

  function handleKeyDown(e) {
    // 한글 등 조합 중인 입력(IME)일 때 Enter/Space가 두 번 처리되어
    // 조합 중이던 글자가 따로 태그로 들어가는 문제를 막습니다.
    if (e.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="hashtag-input">
      {value.map((tag) => (
        <span key={tag} className="hashtag-chip">
          {tag}
          <button type="button" className="hashtag-chip-remove" onClick={() => removeTag(tag)} aria-label={`${tag} 삭제`}>
            ✕
          </button>
        </span>
      ))}
      <input
        type="text"
        className="hashtag-field"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
      />
    </div>
  )
}
