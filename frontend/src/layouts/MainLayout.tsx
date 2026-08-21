import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useEffect } from 'react'
import { Button, Dropdown, Layout, Menu, Tabs, theme } from 'antd'
import {
  CheckSquareOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  ImportOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTabsStore, type WorkTab } from '@/stores/tabs'
import { useAuthStore } from '@/stores/authStore'
import { useMe } from '@/api/users'
import { UserMenu } from '@/components/ui/UserMenu'
import { TodayPanel } from '@/components/ui/TodayPanel'
import TicketTab from '@/features/tickets/TicketTab'
import TaskTab from '@/features/tasks/TaskTab'
import { ModulePlaceholder } from '@/components/ui/ModulePlaceholder'

const { Sider, Header, Content } = Layout

function WorkTabView({ tab }: { tab: WorkTab }) {
  if (tab.kind === 'ticket') {
    return <TicketTab ticketId={tab.recordId} />
  }
  if (tab.kind === 'task') {
    return <TaskTab taskId={tab.recordId} />
  }
  return (
    <ModulePlaceholder title={tab.title} description="Bu kayıt türü henüz desteklenmiyor." />
  )
}

type MenuItem = NonNullable<MenuProps['items']>[number] & { permission: string }

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Panel', permission: 'dashboard.view' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Müşteriler', permission: 'customers.view' },
  { key: '/tickets', icon: <CustomerServiceOutlined />, label: 'Destek Kayıtları', permission: 'tickets.view' },
  { key: '/tasks', icon: <CheckSquareOutlined />, label: 'Görevler', permission: 'tasks.view' },
  { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Satışlar', permission: 'sales.view' },
  { key: '/import', icon: <ImportOutlined />, label: 'Veri Aktarımı', permission: 'imports.view' },
  { key: '/users', icon: <UserOutlined />, label: 'Kullanıcılar', permission: 'users.view' },
]

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tabs, activeTabId, closeTab, setActiveTab } = useTabsStore()
  const me = useAuthStore((s) => s.me)
  const can = useAuthStore((s) => s.can)
  const setMe = useAuthStore((s) => s.setMe)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const meQuery = useMe()
  const { token } = theme.useToken()

  useEffect(() => {
    if (meQuery.data) {
      setMe(meQuery.data)
    }
  }, [meQuery.data, setMe])

  const handleTabEdit = (
    targetKey: ReactMouseEvent | ReactKeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action === 'remove') {
      closeTab(String(targetKey))
    }
  }

  const handleTabClick = (key: string) => {
    if (key === activeTabId) {
      setActiveTab(null)
    }
  }

  const newTabItems: MenuProps['items'] = [
    { key: 'ticket', icon: <CustomerServiceOutlined />, label: 'Yeni Destek Kaydı' },
    { key: 'task', icon: <CheckSquareOutlined />, label: 'Yeni Görev' },
    { key: 'customer', icon: <TeamOutlined />, label: 'Yeni Müşteri' },
  ]

  const handleNewTab = (key: string) => {
    setActiveTab(null)
    if (key === 'ticket') navigate('/tickets?create=1')
    else if (key === 'task') navigate('/tasks?create=1')
    else navigate('/customers')
  }

  const visibleItems = menuItems.filter((item) => !me || can(item.permission))

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" breakpoint="lg">
        <div style={{ color: '#fff', padding: 16, fontWeight: 600, fontSize: 16 }}>
          CRM/ERP
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleItems}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <UserMenu />
        </Header>
        <Layout>
          <Layout style={{ minWidth: 0 }}>
            {tabs.length > 0 && (
              <Tabs
                type="editable-card"
                hideAdd
                activeKey={activeTabId ?? undefined}
                items={tabs.map((t) => ({ key: t.id, label: t.title }))}
                onChange={setActiveTab}
                onTabClick={handleTabClick}
                onEdit={handleTabEdit}
                tabBarExtraContent={{
                  right: (
                    <Dropdown menu={{ items: newTabItems, onClick: ({ key }) => handleNewTab(key) }}>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        aria-label="Yeni kayıt"
                        style={{ marginRight: 8 }}
                      >
                        Yeni Kayıt
                      </Button>
                    </Dropdown>
                  ),
                }}
                style={{ padding: '8px 16px 0' }}
              />
            )}
            <Content style={{ padding: 24 }}>
              {activeTab ? <WorkTabView tab={activeTab} /> : <Outlet />}
            </Content>
          </Layout>
          <TodayPanel />
        </Layout>
      </Layout>
    </Layout>
  )
}
