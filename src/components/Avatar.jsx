import React from 'react'

export default function Avatar({ member, size = 32 }) {
  if (!member) return null
  if (member.avatar) {
    return (
      <img
        className="avatar avatar-photo"
        src={member.avatar}
        alt={member.displayName}
        style={{ width: size, height: size }}
      />
    )
  }
  const initial = member.displayName?.[0] || '?'
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: member.color,
        fontSize: size * 0.45,
      }}
      title={member.displayName}
    >
      {initial}
    </span>
  )
}
