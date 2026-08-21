import { useEffect, type ReactNode } from 'react'
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd'
import trTR from 'antd/locale/tr_TR'
import { BrowserRouter } from 'react-router-dom'
import App from '@/App'
import { useThemeStore } from '@/stores/themeStore'

export function AppTheme({ children }: { children: ReactNode }) {
  const dark = useThemeStore((s) => s.dark)

  useEffect(() => {
    document.body.style.background = dark ? '#000' : '#f5f5f5'
  }, [dark])

  return (
    <ConfigProvider
      locale={trTR}
      theme={{ algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}

export function AppProviders() {
  return (
    <AppTheme>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppTheme>
  )
}
