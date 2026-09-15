import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '../lib/github.js'
import { loadConfig } from '../lib/dataModel.js'

const STORAGE_KEY = 'exchange-diary-session-v1'

const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [client, setClient] = useState(() => {
    const s = readStoredSession()
    return s ? createClient(s) : null
  })
  const [config, setConfig] = useState(null)
  const [configSha, setConfigSha] = useState(undefined)
  const [status, setStatus] = useState('loading') // loading | needs-setup | ready | error
  const [error, setError] = useState(null)

  const refreshConfig = useCallback(async (c) => {
    const activeClient = c || client
    if (!activeClient) return
    try {
      const res = await loadConfig(activeClient)
      if (!res) {
        setStatus('needs-setup')
        setConfig(null)
        setConfigSha(undefined)
      } else {
        setConfig(res.json)
        setConfigSha(res.sha)
        setStatus('ready')
      }
      setError(null)
    } catch (e) {
      setError(e.message || '연결에 실패했어요.')
      setStatus('error')
    }
  }, [client])

  useEffect(() => {
    if (!session) {
      setStatus('needs-setup')
      return
    }
    const c = createClient(session)
    setClient(c)
    refreshConfig(c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.owner, session?.repo, session?.token])

  const connect = useCallback(async ({ owner, repo, token, memberId }) => {
    const next = { owner: owner.trim(), repo: repo.trim(), token: token.trim(), memberId }
    const c = createClient(next)
    await c.verify() // 실패하면 여기서 예외가 던져짐
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    setClient(c)
    await refreshConfig(c)
    return next
  }, [refreshConfig])

  const setMemberId = useCallback((memberId) => {
    setSession((prev) => {
      const next = { ...prev, memberId }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updateToken = useCallback(async (newToken) => {
    const trimmed = newToken.trim()
    if (!trimmed) throw new Error('토큰을 입력해주세요.')
    const next = { ...session, token: trimmed }
    const c = createClient(next)
    await c.verify() // 유효하지 않은 토큰이면 여기서 예외가 던져짐
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    setClient(c)
    await refreshConfig(c)
  }, [session, refreshConfig])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setClient(null)
    setConfig(null)
    setConfigSha(undefined)
    setStatus('needs-setup')
  }, [])

  const currentMember = config?.members?.find((m) => m.id === session?.memberId) || null

  const value = {
    session,
    client,
    config,
    configSha,
    setConfig,
    setConfigSha,
    currentMember,
    members: config?.members || [],
    status,
    error,
    connect,
    logout,
    setMemberId,
    updateToken,
    refreshConfig: () => refreshConfig(client),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있어요.')
  return ctx
}
