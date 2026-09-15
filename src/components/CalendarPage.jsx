import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { loadIndex, todayStr } from '../lib/dataModel.js'
import Calendar from './Calendar.jsx'
import DualEntryView from './DualEntryView.jsx'

export default function CalendarPage() {
  const auth = useAuth()
  const [index, setIndex] = useState({})
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const refreshIndex = useCallback(async () => {
    const { json } = await loadIndex(auth.client)
    setIndex(json)
  }, [auth.client])

  useEffect(() => { refreshIndex() }, [refreshIndex])

  return (
    <div className="calendar-page">
      <Calendar index={index} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <div className="calendar-detail">
        <h2 className="detail-heading">{formatHeading(selectedDate)}</h2>
        <DualEntryView date={selectedDate} onChanged={refreshIndex} />
      </div>
    </div>
  )
}

function formatHeading(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${y}년 ${m}월 ${d}일 (${weekday})`
}
