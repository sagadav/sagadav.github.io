import type { Metadata } from 'next'
import { Dashboard } from './dashboard'

export const metadata: Metadata = {
  title: 'Полгода целей — Сагадеев Артур',
}

export default function GoalsPage() {
  return <Dashboard />
}
