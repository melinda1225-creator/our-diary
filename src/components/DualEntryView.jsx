import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getEntry } from '../lib/dataModel.js'
import { DIARY_WORD } from '../config.js'
import EntryCard from './EntryCard.jsx'
import EntryEditor from './EntryEditor.jsx'
import Avatar from './Avatar.jsx'

export default function DualEntryView({ date, onChanged }) {
  const auth = useAuth()
  const [slots, setSlots] = useState({}) // memberId -> { entry, sha } | null | undefined(loading)

  useEffect(() => {
    let cancelled = false
    setSlots({})
    auth.members.forEach((m) => {
      getEntry(auth.client, date, m.id).then((res) => {
        if (cancelled) return
        setSlots((prev) => ({ ...prev, [m.id]: res || null }))
      })
    })
    return () => { cancelled = true }
  }, [date, auth.members.length])

  return (
    <div className="dual-view">
      {auth.members.map((m) => {
        const slot = slots[m.id]
        return (
          <div className="dual-column" key={m.id}>
            {slot === undefined ? (
              <div className="card skeleton-card" />
            ) : slot === null ? (
              <EmptySlot member={m} date={date} onCreated={(entry, sha) => {
                setSlots((prev) => ({ ...prev, [m.id]: { json: entry, sha } }))
                onChanged?.()
              }} />
            ) : (
              <EntryCard
                entry={slot.json} sha={slot.sha} date={date} memberId={m.id}
                onDeleted={() => {
                  setSlots((prev) => ({ ...prev, [m.id]: null }))
                  onChanged?.()
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptySlot({ member, date, onCreated }) {
  const auth = useAuth()
  const isMine = auth.currentMember?.id === member.id

  if (!isMine) {
    return (
      <div className="card empty-slot">
        <Avatar member={member} />
        <p>{member.displayName}님이 아직 이 날의 {DIARY_WORD}를 쓰지 않았어요.</p>
      </div>
    )
  }

  return (
    <div className="card empty-slot mine">
      <div className="entry-card-who">
        <Avatar member={member} />
        <div className="entry-card-name">{member.displayName}</div>
      </div>
      <EntryEditor
        date={date}
        memberId={member.id}
        initialEntry={null}
        initialSha={undefined}
        onSaved={(entry, sha) => onCreated(entry, sha)}
      />
    </div>
  )
}
