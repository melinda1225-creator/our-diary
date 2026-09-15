import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Setup from './components/Setup.jsx'
import Layout from './components/Layout.jsx'
import CalendarPage from './components/CalendarPage.jsx'
import UserFeedView from './components/UserFeedView.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import './app.css'

const DEFAULT_BG_GRADIENT = 'linear-gradient(165deg, #fdf1f3 0%, #fbeef1 45%, #f7e9ee 100%)'

function Shell() {
  const auth = useAuth()
  const [activeMemberId, setActiveMemberId] = useState(null) // null = 캘린더 보기
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (auth.currentMember?.color) {
      document.documentElement.style.setProperty('--accent', auth.currentMember.color)
      document.documentElement.style.setProperty('--accent-soft', `${auth.currentMember.color}22`)
    }
    document.documentElement.style.setProperty('--bg-gradient', auth.currentMember?.bgColor || DEFAULT_BG_GRADIENT)
  }, [auth.currentMember?.color, auth.currentMember?.bgColor])

  // 멤버가 삭제되는 등으로 더 이상 존재하지 않으면 캘린더 보기로 되돌립니다.
  useEffect(() => {
    if (activeMemberId && !auth.members.some((m) => m.id === activeMemberId)) {
      setActiveMemberId(null)
    }
  }, [activeMemberId, auth.members])

  const ready = auth.status === 'ready' && auth.currentMember

  if (!ready) return <Setup />

  return (
    <Layout activeMemberId={activeMemberId} onSelectMember={setActiveMemberId} onOpenSettings={() => setSettingsOpen(true)}>
      {activeMemberId ? <UserFeedView memberId={activeMemberId} /> : <CalendarPage />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
