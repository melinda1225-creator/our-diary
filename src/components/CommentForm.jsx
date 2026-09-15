import React, { useRef, useState } from 'react'

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && !file) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ text: text.trim(), imageFile: file })
      setText('')
      clearFile()
    } catch (err) {
      setError(err.message || '댓글을 남기지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {preview && (
        <div className="comment-form-preview">
          <img src={preview} alt="첨부 미리보기" />
          <button type="button" className="remove-preview" onClick={clearFile}>✕</button>
        </div>
      )}
      <div className="comment-form-row">
        <input
          type="text"
          placeholder="댓글을 남겨보세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <label className="attach-btn" title="사진 첨부">
          사진 추가
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} hidden />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy || (!text.trim() && !file)}>
          {busy ? '올리는 중...' : '등록'}
        </button>
      </div>
      {error && <p className="setup-error">{error}</p>}
    </form>
  )
}
