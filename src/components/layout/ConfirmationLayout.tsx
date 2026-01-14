import React from 'react'

type Props = {
  children: React.ReactNode
  footer?: React.ReactElement
}

export default function ClientLayout({ children, footer }: Props) {
  return (
    <div className='flex flex-col min-h-screen'>
      <div className='flex flex-1'>

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