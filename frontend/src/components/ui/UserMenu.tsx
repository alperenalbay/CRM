import { useState } from 'react'
import {
  Avatar,
  Button,
  Divider,
  Dropdown,
  Form,
  Input,
  Modal,
  message,
  theme,
} from 'antd'
import {
  CheckOutlined,
  DownOutlined,
  KeyOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useChangePassword } from '@/api/auth'
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  useUpdateAvailability,
  type Availability,
} from '@/api/users'

const STATUS_OPTIONS: Availability[] = ['uygun', 'yemekte', 'disarda', 'molada']

interface PasswordForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export function UserMenu() {
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.me)
  const setMe = useAuthStore((s) => s.setMe)
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const updateAvailability = useUpdateAvailability()
  const changePassword = useChangePassword()
  const { token } = theme.useToken()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [form] = Form.useForm<PasswordForm>()

  if (!me) return null

  const status = (me.availability as Availability) ?? 'uygun'
  const statusColor = AVAILABILITY_COLORS[status]
  const statusLabel = AVAILABILITY_LABELS[status]
  const displayName = me.full_name ?? me.username

  const items: MenuProps['items'] = [
    {
      type: 'group',
      label: 'Durum',
      children: STATUS_OPTIONS.map((value) => ({
        key: `status_${value}`,
        label: AVAILABILITY_LABELS[value],
        icon: value === status ? <CheckOutlined /> : undefined,
      })),
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: dark ? <SunOutlined /> : <MoonOutlined />,
      label: dark ? 'Açık Tema' : 'Koyu Tema',
    },
    {
      key: 'password',
      icon: <KeyOutlined />,
      label: 'Şifre Değiştir',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      danger: true,
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('status_')) {
      updateAvailability.mutate(key.replace('status_', '') as Availability)
      return
    }
    if (key === 'theme') {
      toggleTheme()
      return
    }
    if (key === 'password') {
      setPasswordOpen(true)
      return
    }
    if (key === 'logout') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setMe(null)
      navigate('/login', { replace: true })
    }
  }

  const handlePasswordSubmit = async () => {
    const values = await form.validateFields()
    changePassword.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          message.success('Şifreniz güncellendi.')
          setPasswordOpen(false)
          form.resetFields()
        },
      },
    )
  }

  return (
    <>
      <Dropdown
        menu={{ items, onClick: handleMenuClick }}
        trigger={['click']}
        placement="bottomRight"
      >
        <Button type="text" style={{ height: 56, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            size="small"
            style={{ backgroundColor: token.colorPrimary }}
            icon={<UserOutlined />}
          />
          <span style={{ color: token.colorText }}>
            {displayName}
            {status !== 'uygun' && (
              <span style={{ color: statusColor, marginLeft: 4 }}>({statusLabel})</span>
            )}
          </span>
          <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
        </Button>
      </Dropdown>

      <Modal
        title="Şifre Değiştir"
        open={passwordOpen}
        onOk={handlePasswordSubmit}
        onCancel={() => setPasswordOpen(false)}
        confirmLoading={changePassword.isPending}
        okText="Kaydet"
        cancelText="Vazgeç"
      >
        <Divider style={{ marginTop: 0 }} />
        <Form form={form} layout="vertical">
          <Form.Item
            name="current_password"
            label="Mevcut Şifre"
            rules={[{ required: true, message: 'Mevcut şifrenizi girin.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="Yeni Şifre"
            rules={[
              { required: true, message: 'Yeni şifrenizi girin.' },
              { min: 6, message: 'Şifre en az 6 karakter olmalı.' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Yeni Şifre (Tekrar)"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Yeni şifrenizi tekrar girin.' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Şifreler eşleşmiyor.'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
