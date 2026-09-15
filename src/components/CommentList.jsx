import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import RemoteImage from './RemoteImage.jsx'
import Lightbox from './Lightbox.jsx'

export default function CommentList({ comments }) {
  const auth = useAuth()
  const [lightboxPath, setLightboxPath] = useState(null)
  if (!comments || comments.length === 0) {
    return <p className="comment-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요.</p>
  }
  return (
    <>
      <ul className="comment-list">
        {comments.map((c) => {
          const member = auth.members.find((m) => m.id === c.author)
          return (
            <li key={c.id} className="comment-item">
              <Avatar member={member} size={26} />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{member?.displayName || c.author}</span>
                  <span className="comment-time">{formatTime(c.createdAt)}</span>
                </div>
                {c.text && <p className="comment-text">{c.text}</p>}
                {c.image && (
                  <button
                    type="button" className="comment-image-btn"
                    onClick={() => setLightboxPath(c.image)} aria-label="사진 크게 보기"
                  >
                    <RemoteImage path={c.image} className="comment-image" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <Lightbox path={lightboxPath} onClose={() => setLightboxPath(null)} />
    </>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
