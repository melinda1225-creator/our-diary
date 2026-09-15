// 저장소 안의 파일 구조:
//   config.json                  -> { members: [{ id, displayName, color, ..., checklistFields }], customReactions: [...] }
//                                    (체크리스트 항목은 멤버마다 따로 관리됩니다)
//   index.json                   -> { "2026-09-13": ["minji", "yohan"], ... }  (날짜별 작성자 인덱스, 조회 속도용)
//   entries/YYYY-MM-DD/{id}.json -> 한 사람의 그 날짜 일기
//   images/YYYY-MM-DD/{id}-xxx   -> 댓글에 첨부된 이미지

export const CONFIG_PATH = 'config.json'
export const INDEX_PATH = 'index.json'

export const REACTIONS = [
  { emoji: '👍', label: '따봉' },
  { emoji: '❤️', label: '하트' },
  { emoji: '🍀', label: '네잎클로버' },
  { emoji: '🤗', label: '안아주기' },
  { emoji: '😆', label: '웃김' },
  { emoji: '😢', label: '토닥토닥' },
]

export const DEFAULT_CHECKLIST_FIELDS = [
  { key: 'medication', label: '약', icon: '💊' },
  { key: 'outing', label: '외출/운동', icon: '🚶' },
  { key: 'cleaning', label: '청소', icon: '🧹' },
  { key: 'delivery', label: '배달 주문', icon: '🛵' },
]

export function getChecklistFields(member) {
  return member?.checklistFields || DEFAULT_CHECKLIST_FIELDS
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function entryPath(date, memberId) {
  return `entries/${date}/${memberId}.json`
}

export function entryDirPath(date) {
  return `entries/${date}`
}

export function imagePath(date, memberId, filename) {
  return `images/${date}/${memberId}-${Date.now()}-${filename}`
}

export function emptyEntry(date, memberId) {
  return {
    date,
    author: memberId,
    moodTags: [],
    content: '',
    images: [],
    checklist: {
      sleepHours: null,
    },
    reactions: {},
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function loadConfig(client) {
  const res = await client.getJson(CONFIG_PATH)
  if (!res) return null
  return res
}

export async function initConfig(client, firstMember) {
  const config = { members: [firstMember] }
  await client.putJson(CONFIG_PATH, config, { message: '교환 일지 설정 초기화' })
  await client.putJson(INDEX_PATH, {}, { message: '일지 색인 초기화' })
  return config
}

export async function addMember(client, currentConfig, currentSha, newMember) {
  const updated = { ...currentConfig, members: [...currentConfig.members, newMember] }
  await client.putJson(CONFIG_PATH, updated, { sha: currentSha, message: `${newMember.displayName} 참여` })
  return updated
}

export async function updateMember(client, currentConfig, currentSha, memberId, patch) {
  const updated = {
    ...currentConfig,
    members: currentConfig.members.map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
  }
  await client.putJson(CONFIG_PATH, updated, { sha: currentSha, message: `${memberId} 프로필 수정` })
  return updated
}

export async function removeMember(client, currentConfig, currentSha, memberId) {
  const updated = {
    ...currentConfig,
    members: currentConfig.members.filter((m) => m.id !== memberId),
  }
  await client.putJson(CONFIG_PATH, updated, { sha: currentSha, message: `${memberId} 삭제` })
  return updated
}

export async function addCustomReaction(client, currentConfig, currentSha, reaction) {
  const updated = {
    ...currentConfig,
    customReactions: [...(currentConfig.customReactions || []), reaction],
  }
  await client.putJson(CONFIG_PATH, updated, { sha: currentSha, message: `커스텀 반응 추가: ${reaction.name}` })
  return updated
}

export async function removeCustomReaction(client, currentConfig, currentSha, reactionId) {
  const updated = {
    ...currentConfig,
    customReactions: (currentConfig.customReactions || []).filter((r) => r.id !== reactionId),
  }
  await client.putJson(CONFIG_PATH, updated, { sha: currentSha, message: '커스텀 반응 삭제' })
  return updated
}

export async function addChecklistField(client, currentConfig, currentSha, memberId, field) {
  const member = currentConfig.members.find((m) => m.id === memberId)
  const current = getChecklistFields(member)
  return updateMember(client, currentConfig, currentSha, memberId, { checklistFields: [...current, field] })
}

export async function removeChecklistField(client, currentConfig, currentSha, memberId, key) {
  const member = currentConfig.members.find((m) => m.id === memberId)
  const current = getChecklistFields(member)
  return updateMember(client, currentConfig, currentSha, memberId, { checklistFields: current.filter((f) => f.key !== key) })
}

export async function loadIndex(client) {
  const res = await client.getJson(INDEX_PATH)
  if (!res) return { json: {}, sha: undefined }
  return res
}

async function markIndexed(client, date, memberId) {
  // 낙관적으로 갱신하되, sha 충돌이 나면 한 번 다시 읽어서 재시도합니다.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { json, sha } = await loadIndex(client)
    const authors = new Set(json[date] || [])
    if (authors.has(memberId)) return
    authors.add(memberId)
    const updated = { ...json, [date]: Array.from(authors).sort() }
    try {
      await client.putJson(INDEX_PATH, updated, { sha, message: `색인 갱신 ${date}` })
      return
    } catch (e) {
      if (e.status === 409 || e.status === 422) continue // sha 충돌, 재시도
      throw e
    }
  }
}

async function unmarkIndexed(client, date, memberId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { json, sha } = await loadIndex(client)
    const authors = (json[date] || []).filter((id) => id !== memberId)
    const updated = { ...json }
    if (authors.length === 0) delete updated[date]
    else updated[date] = authors
    try {
      await client.putJson(INDEX_PATH, updated, { sha, message: `색인 갱신 ${date}` })
      return
    } catch (e) {
      if (e.status === 409 || e.status === 422) continue
      throw e
    }
  }
}

export async function getEntry(client, date, memberId) {
  const res = await client.getJson(entryPath(date, memberId))
  if (!res) return null
  return res // { json, sha }
}

export async function saveEntry(client, date, memberId, entryData, sha) {
  const payload = { ...entryData, updatedAt: new Date().toISOString() }
  const result = await client.putJson(entryPath(date, memberId), payload, {
    sha,
    message: `${memberId}의 ${date} 일기`,
  })
  await markIndexed(client, date, memberId)
  return { entry: payload, sha: result?.content?.sha }
}

export async function deleteEntry(client, date, memberId, sha) {
  await client.deleteFile(entryPath(date, memberId), sha, { message: `${memberId}의 ${date} 일기 삭제` })
  await unmarkIndexed(client, date, memberId)
}

export async function listDatesForMember(client, memberId) {
  const { json } = await loadIndex(client)
  return Object.keys(json)
    .filter((date) => (json[date] || []).includes(memberId))
    .sort((a, b) => (a < b ? 1 : -1)) // 최신순
}

export function toggleReaction(entry, emoji, memberId) {
  const current = entry.reactions?.[emoji] || []
  const has = current.includes(memberId)
  const nextList = has ? current.filter((id) => id !== memberId) : [...current, memberId]
  const reactions = { ...entry.reactions, [emoji]: nextList }
  if (nextList.length === 0) delete reactions[emoji]
  return { ...entry, reactions }
}

export function withNewComment(entry, comment) {
  return { ...entry, comments: [...(entry.comments || []), comment] }
}

export function makeCommentId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `c-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
