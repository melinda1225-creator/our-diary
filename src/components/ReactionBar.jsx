import React, { useEffect, useRef, useState } from 'react'
import { REACTIONS, addCustomReaction, makeCommentId, removeCustomReaction } from '../lib/dataModel.js'
import { resizeStickerToDataUrl } from '../lib/image.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ReactionBar({ entry, onToggle }) {
  const auth = useAuth()
  const myId = auth.currentMember?.id
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(null) // { file, preview, name }
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [removingCustomId, setRemovingCustomId] = useState(null)
  const wrapRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setPending(null)
        setUploadError(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const builtIn = REACTIONS.map((r) => ({ key: r.emoji, label: r.label, type: 'emoji', value: r.emoji }))
  const custom = (auth.config?.customReactions || []).map((r) => ({
    key: `custom:${r.id}`, label: r.name, type: 'image', value: r.image,
  }))
  const allReactions = [...builtIn, ...custom]

  function namesFor(key) {
    const ids = entry.reactions?.[key] || []
    return ids
      .map((id) => auth.members.find((m) => m.id === id)?.displayName || id)
      .join(', ')
  }

  const activeReactions = allReactions.filter((r) => (entry.reactions?.[r.key]?.length || 0) > 0)

  function handleFilePicked(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPending({ file, preview: URL.createObjectURL(file), name: '' })
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleConfirmSticker(e) {
    e.preventDefault()
    if (!pending) return
    setUploading(true)
    setUploadError(null)
    try {
      const image = await resizeStickerToDataUrl(pending.file, 64)
      const reaction = { id: makeCommentId(), name: pending.name.trim() || '반응', image }
      const updated = await addCustomReaction(auth.client, auth.config, auth.configSha, reaction)
      auth.setConfig(updated)
      await auth.refreshConfig()
      onToggle(`custom:${reaction.id}`)
      setPending(null)
      setOpen(false)
    } catch (err) {
      setUploadError(err.message || '반응을 추가하지 못했어요.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteCustom(e, reactionId, label) {
    e.stopPropagation()
    if (!window.confirm(`"${label}" 반응을 삭제할까요? 이미 남긴 반응 기록에서는 사라지지 않고 빈 이미지로 보일 수 있어요.`)) return
    setRemovingCustomId(reactionId)
    try {
      const updated = await removeCustomReaction(auth.client, auth.config, auth.configSha, reactionId)
      auth.setConfig(updated)
      await auth.refreshConfig()
    } finally {
      setRemovingCustomId(null)
    }
  }

  return (
    <div className="reaction-bar">
      {activeReactions.map((r) => {
        const count = entry.reactions?.[r.key]?.length || 0
        const mine = entry.reactions?.[r.key]?.includes(myId)
        return (
          <button
            key={r.key}
            className={`reaction-btn ${mine ? 'active' : ''}`}
            onClick={() => onToggle(r.key)}
            title={`${r.label} · ${namesFor(r.key)}`}
          >
            {r.type === 'image' ? <img src={r.value} alt={r.label} className="reaction-img" /> : <span>{r.value}</span>}
            <span className="reaction-count">{count}</span>
          </button>
        )
      })}

      <div className="reaction-add-wrap" ref={wrapRef}>
        <button type="button" className="reaction-add-btn" onClick={() => setOpen((v) => !v)}>
          + 반응 추가
        </button>
        {open && (
          <div className="reaction-picker">
            {!pending ? (
              <>
                <div className="reaction-picker-grid">
                  {allReactions.map((r) => {
                    const reactionId = r.key.startsWith('custom:') ? r.key.slice('custom:'.length) : null
                    return (
                      <div key={r.key} className="reaction-picker-cell">
                        <button
                          type="button"
                          className="reaction-picker-item"
                          title={r.label}
                          onClick={() => { onToggle(r.key); setOpen(false) }}
                        >
                          {r.type === 'image' ? <img src={r.value} alt={r.label} /> : r.value}
                        </button>
                        {reactionId && (
                          <button
                            type="button"
                            className="reaction-picker-delete"
                            title="이 반응 삭제"
                            onClick={(e) => handleDeleteCustom(e, reactionId, r.label)}
                            disabled={removingCustomId === reactionId}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <label className="reaction-upload-btn">
                  + 이미지로 새 반응 만들기
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePicked} hidden />
                </label>
              </>
            ) : (
              <form className="reaction-sticker-form" onSubmit={handleConfirmSticker}>
                <img src={pending.preview} alt="새 반응 미리보기" className="reaction-sticker-preview" />
                <input
                  type="text" placeholder="반응 이름 (예: 최고)" value={pending.name}
                  onChange={(e) => setPending((p) => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
                {uploadError && <p className="setup-error">{uploadError}</p>}
                <div className="reaction-sticker-actions">
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => setPending(null)}>취소</button>
                  <button type="submit" className="btn btn-primary btn-small" disabled={uploading}>
                    {uploading ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
