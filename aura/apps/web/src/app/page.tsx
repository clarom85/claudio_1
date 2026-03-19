import { redirect } from 'next/navigation'

// Root page — redirect to discover (middleware handles auth check)
export default function RootPage() {
  redirect('/discover')
}
