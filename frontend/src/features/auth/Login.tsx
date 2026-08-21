import { Button, Card, Form, Input, App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useLogin } from '@/api/auth'

interface LoginFormValues {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const login = useLogin()

  const onFinish = async (values: LoginFormValues) => {
    try {
      const tokens = await login.mutateAsync(values)
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      navigate('/dashboard')
    } catch {
      message.error('Kullanıcı adı veya şifre hatalı.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card title="CRM/ERP Girişi" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Kullanıcı Adı"
            name="username"
            rules={[{ required: true, message: 'Kullanıcı adı girin' }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Şifre"
            name="password"
            rules={[{ required: true, message: 'Şifre girin' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={login.isPending}>
            Giriş Yap
          </Button>
        </Form>
      </Card>
    </div>
  )
}
