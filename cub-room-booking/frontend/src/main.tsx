import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider } from 'antd'
import zhTW from 'antd/locale/zh_TW'
import { themeConfig } from './theme.ts'
import './global.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
dayjs.locale('zh-tw')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhTW} theme={themeConfig}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
