import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getEntry, listDatesForMember } from '../lib/dataModel.js'
import { DIARY_WORD } from '../config.js'
import EntryCard from './EntryCard.jsx'

const PAGE_SIZE = 8

export default function UserFeedView({ memberId }) {
  const auth = useAuth()
  const [dates, setDates] = useState([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [entries, setEntries] = useState({}) // date -> { entry, sha } | 'loading'
  const [loadingDates, setLoadingDates] = useState(true)

  useEffect(() => {
    setDates([])
    setVisibleCount(PAGE_SIZE)
    setEntries({})
    setLoadingDates(true)
    listDatesForMember(auth.client, memberId).then((ds) => {
      setDates(ds) // 최신 날짜가 먼저 오도록 정렬되어 있음
      setLoadingDates(false)
    })
  }, [memberId])

  const visibleDates = dates.slice(0, visibleCount)

  useEffect(() => {
    visibleDates.forEach((date) => {
      if (entries[date]) return
      setEntries((prev) => ({ ...prev, [date]: 'loading' }))
      getEntry(auth.client, date, memberId).then((res) => {
        setEntries((prev) => ({ ...prev, [date]: res }))
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDates.join(','), memberId])

  const member = auth.members.find((m) => m.id === memberId)

  return (
    <div className="feed-view">
      <p className="feed-eyebrow">모아보기</p>
      <h2 className="detail-heading">{member?.displayName}의 {DIARY_WORD}</h2>

      {loadingDates && <p className="feed-loading">불러오는 중...</p>}
      {!loadingDates && dates.length === 0 && (
        <p className="feed-empty">{member?.displayName}님이 아직 쓴 {DIARY_WORD}가 없어요.</p>
      )}

      <div className="feed-list">
        {visibleDates.map((date) => {
          const slot = entries[date]
          if (!slot || slot === 'loading') {
            return <div className="card skeleton-card" key={date} />
          }
          return (
            <EntryCard
              key={date}
              date={date}
              memberId={memberId}
              entry={slot.json}
              sha={slot.sha}
              showDate
              onDeleted={() => {
                setDates((prev) => prev.filter((d) => d !== date))
                setEntries((prev) => {
                  const next = { ...prev }
                  delete next[date]
                  return next
                })
              }}
            />
          )
        })}
      </div>

      {visibleCount < dates.length && (
        <button className="btn" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
          더 보기
        </button>
      )}
    </div>
  )
}
