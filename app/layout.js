import './globals.css'

export const metadata = {
  title: 'Category Manager',
  description: 'Marketplace category hierarchy manager and file renamer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
