export type FakeAccountRole = 'admin' | 'branch-owner'

export interface FakeAccount {
  email: string
  password: string
  role: FakeAccountRole
  name: string
  branchName?: string
  destination: string
}

export const FAKE_ACCOUNTS: FakeAccount[] = [
  {
    email: 'admin@nova.local',
    password: 'admin123',
    role: 'admin',
    name: 'NOVA Admin',
    destination: '/admin/dashboard',
  },
  {
    email: 'ava@nova.local',
    password: 'ava123',
    role: 'branch-owner',
    name: 'Ava Byrne',
    branchName: 'north-house',
    destination: '/north-house/dashboard',
  },
  {
    email: 'noah@nova.local',
    password: 'noah123',
    role: 'branch-owner',
    name: 'Noah Walsh',
    branchName: 'central-house',
    destination: '/central-house/dashboard',
  },
  {
    email: 'mia@nova.local',
    password: 'mia123',
    role: 'branch-owner',
    name: 'Mia Kelly',
    branchName: 'south-house',
    destination: '/south-house/dashboard',
  },
]

export const FAKE_ACCOUNT_STORAGE_KEY = 'nova-fake-account'

export function findFakeAccount(email: string, password: string) {
  return FAKE_ACCOUNTS.find((account) => account.email === email.trim().toLowerCase() && account.password === password)
}

export function getStoredFakeAccount(): FakeAccount | null {
  const storedAccount = window.localStorage.getItem(FAKE_ACCOUNT_STORAGE_KEY) ?? window.sessionStorage.getItem(FAKE_ACCOUNT_STORAGE_KEY)
  if (!storedAccount) return null

  try {
    return JSON.parse(storedAccount) as FakeAccount
  } catch {
    return null
  }
}
