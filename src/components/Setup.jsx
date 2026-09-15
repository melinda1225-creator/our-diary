import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { initConfig, addMember } from '../lib/dataModel.js'
import { SITE_TITLE, DIARY_WORD } from '../config.js'
import AvatarPicker from './AvatarPicker.jsx'
import Avatar from './Avatar.jsx'

const PALETTE = ['#3F9C8B', '#E8748C', '#E3A63E', '#6C7FDB', '#7FA26E', '#9C6BA8', '#4FA0D9']
const BG_PALETTE = ['#fdf1f3', '#eef2fb', '#f4f5f0', '#eaf7f0', '#fdf6e3', '#f3eefc', '#ffffff']

export default function Setup() {
  const auth = useAuth()
  const [form, setForm] = useState({ owner: '', repo: '', token: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleConnect(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await auth.connect({ owner: form.owner, repo: form.repo, token: form.token })
    } catch (err) {
      setError(err.message || '연결에 실패했어요. 저장소 이름과 토큰을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (!auth.session) {
    return (
      <ScreenShell title="저장소 연결하기" subtitle={`${DIARY_WORD} 데이터를 저장할 GitHub private 레포와 개인 액세스 토큰을 입력해주세요.`}>
        <form onSubmit={handleConnect} className="setup-form">
          <label>
            <span>레포 소유자 (아이디)</span>
            <input
              type="text" placeholder="예: minji-kim" required
              value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
            />
          </label>
          <label>
            <span>레포 이름</span>
            <input
              type="text" placeholder="예: our-diary-data" required
              value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })}
            />
          </label>
          <label>
            <span>Personal Access Token</span>
            <input
              type="password" placeholder="ghp_..." required
              value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })}
            />
          </label>
          <p className="setup-hint">
            토큰은 이 브라우저에만 저장돼요. GitHub → Settings → Developer settings →
            Personal access tokens에서 해당 레포에 대한 <b>Contents 읽기/쓰기</b> 권한으로 발급해주세요.
          </p>
          {error && <p className="setup-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '연결하는 중...' : '연결하기'}
          </button>
        </form>
      </ScreenShell>
    )
  }

  if (auth.status === 'loading') {
    return <ScreenShell title="불러오는 중..." subtitle="레포 정보를 확인하고 있어요." />
  }

  if (auth.status === 'error') {
    return (
      <ScreenShell title="연결 실패" subtitle={auth.error}>
        <button className="btn" onClick={auth.logout}>다시 연결하기</button>
      </ScreenShell>
    )
  }

  if (auth.status === 'needs-setup') {
    return <CreateFirstMember />
  }

  if (auth.status === 'ready' && !auth.currentMember) {
    return <PickOrAddMember />
  }

  return null
}

function CreateFirstMember() {
  const auth = useAuth()
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [bgColor, setBgColor] = useState(BG_PALETTE[0])
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const id = slugify(name)
      const member = { id, displayName: name.trim(), color, bgColor, avatar }
      await initConfig(auth.client, member)
      await auth.refreshConfig()
      auth.setMemberId(id)
    } catch (err) {
      setError(err.message || '초기 설정에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenShell title="처음이시군요 👋" subtitle={`이 레포에 ${SITE_TITLE}를 새로 시작할게요. 먼저 당신의 이름과 색을 정해주세요.`}>
      <form onSubmit={handleSubmit} className="setup-form">
        <AvatarPicker value={avatar} fallbackColor={color} fallbackInitial={name[0] || '?'} onChange={setAvatar} />
        <label>
          <span>이름 (닉네임)</span>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 민지" />
        </label>
        <ColorPicker value={color} onChange={setColor} />
        <ColorPicker value={bgColor} onChange={setBgColor} label="배경색" palette={BG_PALETTE} />
        {error && <p className="setup-error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
          {loading ? '만드는 중...' : '시작하기'}
        </button>
      </form>
    </ScreenShell>
  )
}

function PickOrAddMember() {
  const auth = useAuth()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[1])
  const [bgColor, setBgColor] = useState(BG_PALETTE[0])
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const id = slugify(name)
      if (auth.members.some((m) => m.id === id)) throw new Error('이미 같은 이름의 멤버가 있어요.')
      const member = { id, displayName: name.trim(), color, bgColor, avatar }
      const updated = await addMember(auth.client, auth.config, auth.configSha, member)
      auth.setConfig(updated)
      await auth.refreshConfig()
      auth.setMemberId(id)
    } catch (err) {
      setError(err.message || '추가에 실패했어요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenShell title="당신은 누구신가요?" subtitle="이 레포에 이미 등록된 멤버 중 하나를 골라주세요.">
      <div className="member-pick-list">
        {auth.members.map((m) => (
          <button key={m.id} className="member-pick-item" onClick={() => auth.setMemberId(m.id)}>
            <Avatar member={m} size={28} />
            {m.displayName}
          </button>
        ))}
      </div>

      {!adding ? (
        <button className="btn btn-ghost" onClick={() => setAdding(true)}>+ 새 멤버로 참여하기</button>
      ) : (
        <form onSubmit={handleAdd} className="setup-form">
          <AvatarPicker value={avatar} fallbackColor={color} fallbackInitial={name[0] || '?'} onChange={setAvatar} />
          <label>
            <span>이름 (닉네임)</span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 요한" />
          </label>
          <ColorPicker value={color} onChange={setColor} />
          <ColorPicker value={bgColor} onChange={setBgColor} label="배경색" palette={BG_PALETTE} />
          {error && <p className="setup-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading || !name.trim()}>
            {loading ? '추가하는 중...' : '참여하기'}
          </button>
        </form>
      )}
    </ScreenShell>
  )
}

export function ColorPicker({ value, onChange, label = '내 색상', palette = PALETTE }) {
  return (
    <label>
      <span>{label}</span>
      <div className="color-picker">
        {palette.map((c) => (
          <button
            type="button" key={c}
            className={`swatch ${value === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={c}
          />
        ))}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="swatch-custom" />
      </div>
    </label>
  )
}

export { BG_PALETTE }

function slugify(name) {
  const base = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
  return base || `member-${Date.now()}`
}

function ScreenShell({ title, subtitle, children }) {
  return (
    <div className="setup-screen">
      <div className="setup-card card">
        <h1>{title}</h1>
        {subtitle && <p className="setup-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
