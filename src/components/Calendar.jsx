import React, { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { todayStr } from '../lib/dataModel.js'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ index, selectedDate, onSelectDate }) {
  const auth = useAuth()
  const today = todayStr()
  const [cursor, setCursor] = useState(() => {
    const [y, m] = (selectedDate || today).split('-').map(Number)
    return { year: y, month: m - 1 } // month: 0-11
  })

  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  function shiftMonth(delta) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="calendar card">
      <div className="calendar-header">
        <button className="btn btn-ghost btn-small" onClick={() => shiftMonth(-1)}>‹</button>
        <h2>{cursor.year}년 {cursor.month + 1}월</h2>
        <button className="btn btn-ghost btn-small" onClick={() => shiftMonth(1)}>›</button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={i} className="calendar-cell empty" />
          const authors = index[cell] || []
          const isSelected = cell === selectedDate
          const isToday = cell === today
          return (
            <button
              key={cell}
              className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelectDate(cell)}
            >
              <span className="calendar-day-num">{Number(cell.split('-')[2])}</span>
              <span className="calendar-dots">
                {authors.map((id) => {
                  const m = auth.members.find((mm) => mm.id === id)
                  return <span key={id} className="calendar-dot" style={{ background: m?.color || '#ccc' }} />
                })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push(`${year}-${mm}-${dd}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
