import React from 'react'

type Props = {
  sidebar: React.ReactElement
  children: React.ReactNode
  footer?: React.ReactElement
}

export default function ClientLayout({ sidebar, children, footer }: Props) {
  return (
    <div className='flex flex-col min-h-screen'>
      <div className='flex flex-1'>
        <aside className='w-80 p-6 overflow-y-auto'>
          {sidebar}
        </aside>

        <main className='flex-1 p-6 overflow-y-auto'>
          {children}
        </main>
      </div>
      {footer && (
        <footer className='bg-footerBackground mt-auto'>
          {footer}
        </footer>
      )}
    </div>
  )
}