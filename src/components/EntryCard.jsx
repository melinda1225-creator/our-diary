import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  deleteEntry, getChecklistFields, imagePath, makeCommentId, saveEntry, toggleReaction, withNewComment,
} from '../lib/dataModel.js'
import { resizeImageFile } from '../lib/image.js'
import Avatar from './Avatar.jsx'
import RemoteImage from './RemoteImage.jsx'
import Lightbox from './Lightbox.jsx'
import ReactionBar from './ReactionBar.jsx'
import CommentList from './CommentList.jsx'
import CommentForm from './CommentForm.jsx'
import EntryEditor from './EntryEditor.jsx'

export default function EntryCard({ entry: initialEntry, sha: initialSha, date, memberId, showDate = false, onDeleted }) {
  const auth = useAuth()
  const [entry, setEntry] = useState(initialEntry)
  const [sha, setSha] = useState(initialSha)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lightboxPath, setLightboxPath] = useState(null)

  const author = auth.members.find((m) => m.id === memberId)
  const isMine = auth.currentMember?.id === memberId
  const moodTags = entry.moodTags || []

  async function persist(nextEntry) {
    const { entry: saved, sha: nextSha } = await saveEntry(auth.client, date, memberId, nextEntry, sha)
    setEntry(saved)
    setSha(nextSha)
  }

  async function handleToggleReaction(emoji) {
    if (busy) return
    setBusy(true)
    const prev = entry
    const optimistic = toggleReaction(entry, emoji, auth.currentMember.id)
    setEntry(optimistic)
    try {
      await persist(optimistic)
    } catch (e) {
      setEntry(prev) // 실패하면 되돌리기
    } finally {
      setBusy(false)
    }
  }

  async function handleAddComment({ text, imageFile }) {
    let imgPath = null
    if (imageFile) {
      const { base64, extension } = await resizeImageFile(imageFile)
      imgPath = imagePath(date, auth.currentMember.id, `comment.${extension}`)
      await auth.client.putBase64File(imgPath, base64, { message: `댓글 이미지 (${date})` })
    }
    const comment = {
      id: makeCommentId(),
      author: auth.currentMember.id,
      text,
      image: imgPath,
      createdAt: new Date().toISOString(),
    }
    const nextEntry = withNewComment(entry, comment)
    await persist(nextEntry)
  }

  async function handleDelete() {
    if (busy) return
    if (!window.confirm('정말 이 글을 삭제할까요? 댓글과 반응도 함께 사라지고, 되돌릴 수 없어요.')) return
    setBusy(true)
    try {
      await deleteEntry(auth.client, date, memberId, sha)
      onDeleted?.()
    } catch (e) {
      window.alert(e.message || '삭제에 실패했어요.')
      setBusy(false)
    }
  }

  const sleepHours = entry.checklist?.sleepHours
  const images = entry.images || (entry.image ? [entry.image] : [])

  return (
    <article className="entry-card card" style={{ '--author-color': author?.color || 'var(--accent)' }}>
      <header className="entry-card-header">
        <div className="entry-card-who">
          <Avatar member={author} />
          <div>
            <div className="entry-card-name">{author?.displayName || memberId}</div>
            {showDate && <div className="entry-card-date">{formatDate(date)}</div>}
          </div>
        </div>
        {isMine && !editing && (
          <div className="entry-card-actions">
            <button className="btn btn-ghost btn-small" onClick={() => setEditing(true)}>수정</button>
            <button className="btn btn-ghost btn-small btn-danger" onClick={handleDelete} disabled={busy}>삭제</button>
          </div>
        )}
      </header>

      {moodTags.length > 0 && !editing && (
        <div className="entry-mood-tags">
          {moodTags.map((tag) => (
            <span key={tag} className="entry-mood-tag">{tag}</span>
          ))}
        </div>
      )}

      {editing ? (
        <EntryEditor
          date={date}
          memberId={memberId}
          initialEntry={entry}
          initialSha={sha}
          onSaved={(e, s) => { setEntry(e); setSha(s); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="checklist-row readonly">
            {getChecklistFields(author).map((f) => {
              const on = !!entry.checklist?.[f.key]
              return (
                <span key={f.key} className={`chip checklist-status ${on ? 'on' : 'off'}`}>
                  {f.label}:{on ? 'O' : 'X'}
                </span>
              )
            })}
            {sleepHours != null && <span className="chip checklist-status">{sleepHours}시간 수면</span>}
          </div>
          {entry.content ? (
            <p className="entry-content">{entry.content}</p>
          ) : (
            <p className="entry-content empty">글 없이 체크리스트만 기록했어요.</p>
          )}
          {images.length > 0 && (
            <div className="entry-image-grid">
              {images.map((path) => (
                <button
                  type="button"
                  key={path}
                  className="entry-image-btn"
                  onClick={() => setLightboxPath(path)}
                  aria-label="사진 크게 보기"
                >
                  <RemoteImage path={path} className="entry-image" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <ReactionBar entry={entry} onToggle={handleToggleReaction} />

      <div className="comment-section">
        <CommentList comments={entry.comments} />
        <CommentForm onSubmit={handleAddComment} />
      </div>

      <Lightbox path={lightboxPath} onClose={() => setLightboxPath(null)} />
    </article>
  )
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}
