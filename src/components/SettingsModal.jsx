import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { addMember, addChecklistField, getChecklistFields, removeChecklistField, removeCustomReaction, removeMember, updateMember } from '../lib/dataModel.js'
import { DIARY_WORD } from '../config.js'
import { ColorPicker, BG_PALETTE } from './Setup.jsx'
import AvatarPicker from './AvatarPicker.jsx'
import Avatar from './Avatar.jsx'

export default function SettingsModal({ onClose }) {
  const auth = useAuth()
  const [color, setColor] = useState(auth.currentMember?.color)
  const [bgColor, setBgColor] = useState(auth.currentMember?.bgColor || BG_PALETTE[0])
  const [avatar, setAvatar] = useState(auth.currentMember?.avatar || null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [tokenInput, setTokenInput] = useState('')
  const [tokenBusy, setTokenBusy] = useState(false)
  const [tokenError, setTokenError] = useState(null)
  const [tokenSuccess, setTokenSuccess] = useState(false)

  const [addingMember, setAddingMember] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#4FA0D9')
  const [newAvatar, setNewAvatar] = useState(null)
  const [addError, setAddError] = useState(null)
  const [addBusy, setAddBusy] = useState(false)

  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  const [removingReactionId, setRemovingReactionId] = useState(null)

  const [addingField, setAddingField] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldIcon, setNewFieldIcon] = useState('📝')
  const [fieldError, setFieldError] = useState(null)
  const [fieldBusy, setFieldBusy] = useState(false)
  const [removingFieldKey, setRemovingFieldKey] = useState(null)

  const profileChanged = color !== auth.currentMember?.color
    || avatar !== (auth.currentMember?.avatar || null)
    || bgColor !== (auth.currentMember?.bgColor || BG_PALETTE[0])

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const updated = await updateMember(auth.client, auth.config, auth.configSha, auth.currentMember.id, { color, bgColor, avatar })
      auth.setConfig(updated)
      await auth.refreshConfig()
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    setAddBusy(true)
    setAddError(null)
    try {
      const id = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
      if (!id) throw new Error('이름을 입력해주세요.')
      if (auth.members.some((m) => m.id === id)) throw new Error('이미 있는 이름이에요.')
      const updated = await addMember(auth.client, auth.config, auth.configSha, { id, displayName: newName.trim(), color: newColor, avatar: newAvatar })
      auth.setConfig(updated)
      await auth.refreshConfig()
      setNewName('')
      setNewAvatar(null)
      setAddingMember(false)
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddBusy(false)
    }
  }

  async function handleRemoveMember(member) {
    const isSelf = member.id === auth.currentMember?.id
    const warning = isSelf
      ? `${member.displayName}(나)님을 멤버에서 삭제할까요? 삭제하면 자동으로 로그아웃돼요. 이미 쓴 ${DIARY_WORD}는 그대로 남아있어요.`
      : `${member.displayName}님을 멤버에서 삭제할까요? 이미 쓴 ${DIARY_WORD}는 그대로 남아있지만, 더는 이 사람으로 로그인할 수 없어요.`
    if (!window.confirm(warning)) return
    setRemovingId(member.id)
    setRemoveError(null)
    try {
      const updated = await removeMember(auth.client, auth.config, auth.configSha, member.id)
      auth.setConfig(updated)
      if (isSelf) {
        auth.logout()
        return
      }
      await auth.refreshConfig()
    } catch (err) {
      setRemoveError(err.message || '삭제에 실패했어요.')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleRemoveCustomReaction(reaction) {
    if (!window.confirm(`"${reaction.name}" 반응을 삭제할까요? 이미 남긴 반응 기록에서는 사라지지 않고 빈 이미지로 보일 수 있어요.`)) return
    setRemovingReactionId(reaction.id)
    try {
      const updated = await removeCustomReaction(auth.client, auth.config, auth.configSha, reaction.id)
      auth.setConfig(updated)
      await auth.refreshConfig()
    } finally {
      setRemovingReactionId(null)
    }
  }

  async function handleAddField(e) {
    e.preventDefault()
    setFieldBusy(true)
    setFieldError(null)
    try {
      const label = newFieldLabel.trim()
      if (!label) throw new Error('항목 이름을 입력해주세요.')
      const base = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
      const key = base || `item-${Date.now()}`
      const existing = getChecklistFields(auth.currentMember)
      if (key === 'sleepHours' || existing.some((f) => f.key === key)) {
        throw new Error('이미 있는 항목 이름이에요.')
      }
      const updated = await addChecklistField(auth.client, auth.config, auth.configSha, auth.currentMember.id, {
        key, label, icon: newFieldIcon.trim() || '📝',
      })
      auth.setConfig(updated)
      await auth.refreshConfig()
      setNewFieldLabel('')
      setNewFieldIcon('📝')
      setAddingField(false)
    } catch (err) {
      setFieldError(err.message || '추가하지 못했어요.')
    } finally {
      setFieldBusy(false)
    }
  }

  async function handleRemoveField(field) {
    if (!window.confirm(`"${field.label}" 항목을 내 체크리스트에서 뺄까요? 이미 저장된 글의 기록은 그대로 남아있지만, 화면에는 더 이상 표시되지 않아요.`)) return
    setRemovingFieldKey(field.key)
    try {
      const updated = await removeChecklistField(auth.client, auth.config, auth.configSha, auth.currentMember.id, field.key)
      auth.setConfig(updated)
      await auth.refreshConfig()
    } finally {
      setRemovingFieldKey(null)
    }
  }

  async function handleUpdateToken(e) {
    e.preventDefault()
    setTokenBusy(true)
    setTokenError(null)
    setTokenSuccess(false)
    try {
      await auth.updateToken(tokenInput)
      setTokenInput('')
      setTokenSuccess(true)
    } catch (err) {
      setTokenError(err.message || '토큰을 확인해주세요.')
    } finally {
      setTokenBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>설정</h2>
          <button className="btn btn-ghost btn-small" onClick={onClose}>✕</button>
        </div>

        <section className="modal-section">
          <h3>내 프로필</h3>
          <AvatarPicker
            value={avatar}
            fallbackColor={color}
            fallbackInitial={auth.currentMember?.displayName?.[0] || '?'}
            onChange={setAvatar}
          />
          <ColorPicker value={color} onChange={setColor} />
          <ColorPicker value={bgColor} onChange={setBgColor} label="배경색" palette={BG_PALETTE} />
          <button className="btn btn-primary btn-small" onClick={handleSaveProfile} disabled={savingProfile || !profileChanged}>
            {savingProfile ? '저장 중...' : '프로필 저장'}
          </button>
        </section>

        <section className="modal-section">
          <h3>참여 멤버</h3>
          <ul className="settings-member-list">
            {auth.members.map((m) => (
              <li key={m.id}>
                <Avatar member={m} size={26} />
                <span className="settings-member-name">{m.displayName}</span>
                {m.id === auth.currentMember?.id && <span className="me-badge">나</span>}
                <button
                  type="button"
                  className="btn btn-ghost btn-small btn-danger settings-member-remove"
                  onClick={() => handleRemoveMember(m)}
                  disabled={removingId === m.id}
                >
                  {removingId === m.id ? '삭제 중...' : '삭제'}
                </button>
              </li>
            ))}
          </ul>
          {removeError && <p className="setup-error">{removeError}</p>}
          {!addingMember ? (
            <button className="btn btn-ghost btn-small" onClick={() => setAddingMember(true)}>+ 멤버 추가하기</button>
          ) : (
            <form className="setup-form" onSubmit={handleAddMember}>
              <AvatarPicker value={newAvatar} fallbackColor={newColor} fallbackInitial={newName[0] || '?'} onChange={setNewAvatar} />
              <label>
                <span>이름</span>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </label>
              <ColorPicker value={newColor} onChange={setNewColor} />
              {addError && <p className="setup-error">{addError}</p>}
              <div className="entry-editor-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAddingMember(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={addBusy}>{addBusy ? '추가 중...' : '추가'}</button>
              </div>
            </form>
          )}
        </section>

        <section className="modal-section">
          <h3>커스텀 반응</h3>
          {(auth.config?.customReactions || []).length === 0 ? (
            <p className="settings-repo-info">아직 만든 이미지 반응이 없어요. 글 아래 "+ 반응 추가"에서 만들 수 있어요.</p>
          ) : (
            <ul className="settings-member-list">
              {(auth.config?.customReactions || []).map((r) => (
                <li key={r.id}>
                  <img src={r.image} alt={r.name} className="settings-reaction-thumb" />
                  <span className="settings-member-name">{r.name}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-small btn-danger settings-member-remove"
                    onClick={() => handleRemoveCustomReaction(r)}
                    disabled={removingReactionId === r.id}
                  >
                    {removingReactionId === r.id ? '삭제 중...' : '삭제'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="modal-section">
          <h3>내 체크리스트 항목</h3>
          <p className="settings-repo-info">여기서 바꾸는 항목은 나에게만 적용돼요. 상대방은 자기 화면에서 따로 관리해요.</p>
          <ul className="settings-member-list">
            {getChecklistFields(auth.currentMember).map((f) => (
              <li key={f.key}>
                <span className="settings-field-icon">{f.icon}</span>
                <span className="settings-member-name">{f.label}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-small btn-danger settings-member-remove"
                  onClick={() => handleRemoveField(f)}
                  disabled={removingFieldKey === f.key}
                >
                  {removingFieldKey === f.key ? '삭제 중...' : '삭제'}
                </button>
              </li>
            ))}
          </ul>
          {!addingField ? (
            <button className="btn btn-ghost btn-small" onClick={() => setAddingField(true)}>+ 항목 추가하기</button>
          ) : (
            <form className="setup-form" onSubmit={handleAddField}>
              <div className="field-add-row">
                <label className="field-icon-input">
                  <span>아이콘</span>
                  <input
                    type="text" value={newFieldIcon}
                    onChange={(e) => setNewFieldIcon(e.target.value)} maxLength={2}
                  />
                </label>
                <label className="field-label-input">
                  <span>이름</span>
                  <input
                    type="text" value={newFieldLabel} placeholder="예: 물 마시기"
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                  />
                </label>
              </div>
              {fieldError && <p className="setup-error">{fieldError}</p>}
              <div className="entry-editor-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setAddingField(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={fieldBusy}>{fieldBusy ? '추가 중...' : '추가'}</button>
              </div>
            </form>
          )}
        </section>

        <section className="modal-section">
          <h3>토큰</h3>
          <p className="settings-repo-info">토큰이 만료됐거나 새로 발급받았다면 여기서 바로 바꿀 수 있어요. 로그아웃할 필요 없어요.</p>
          <form className="setup-form" onSubmit={handleUpdateToken}>
            <label>
              <span>새 Personal Access Token</span>
              <input
                type="password" placeholder="github_pat_..." value={tokenInput}
                onChange={(e) => { setTokenInput(e.target.value); setTokenSuccess(false) }}
                required
              />
            </label>
            {tokenError && <p className="setup-error">{tokenError}</p>}
            {tokenSuccess && <p className="settings-token-success">토큰을 갱신했어요.</p>}
            <button type="submit" className="btn btn-small" disabled={tokenBusy || !tokenInput.trim()}>
              {tokenBusy ? '확인하는 중...' : '토큰 저장'}
            </button>
          </form>
        </section>

        <section className="modal-section">
          <h3>저장소</h3>
          <p className="settings-repo-info">{auth.session.owner}/{auth.session.repo}</p>
          <button className="btn btn-small" onClick={auth.logout}>로그아웃 (연결 해제)</button>
        </section>
      </div>
    </div>
  )
}
