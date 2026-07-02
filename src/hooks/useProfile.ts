import { useState } from 'react'

export interface Profile {
  name: string
  hourlyRate: number
  groqApiKey: string
}

const DEFAULT: Profile = { name: 'Михаил', hourlyRate: 150, groqApiKey: '' }

function load(): Profile {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem('chexov:profile') ?? '{}') }
  } catch {
    return DEFAULT
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(load)

  function setProfile(updates: Partial<Profile>) {
    const next = { ...profile, ...updates }
    setProfileState(next)
    localStorage.setItem('chexov:profile', JSON.stringify(next))
  }

  return [profile, setProfile] as const
}

export function loadProfile(): Profile {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem('chexov:profile') ?? '{}') }
  } catch {
    return DEFAULT
  }
}
