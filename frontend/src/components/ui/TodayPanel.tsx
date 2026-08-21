import { Avatar, Divider, Empty, List, Tag, Typography, theme } from 'antd'
import {
  CommentOutlined,
  FileTextOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAgents } from '@/api/tickets'
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  useTodayActivity,
  type Availability,
} from '@/api/users'
import { useAuthStore } from '@/stores/authStore'

const { Text } = Typography

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TodayPanel() {
  const { token } = theme.useToken()
  const me = useAuthStore((s) => s.me)
  const agents = useAgents()
  const { data } = useTodayActivity()

  const team = agents.data ?? []

  return (
    <div
      style={{
        width: 300,
        borderLeft: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        overflowY: 'auto',
        padding: 12,
      }}
    >
      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
        Ekip Durumu
      </Text>
      <List
        size="small"
        dataSource={team}
        split={false}
        renderItem={(agent) => {
          const availability = (agent.availability as Availability) ?? 'uygun'
          const isMe = me?.id === agent.id
          return (
            <List.Item style={{ padding: '4px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="small"
                    style={{
                      backgroundColor: AVAILABILITY_COLORS[availability] === 'green'
                        ? token.colorPrimary
                        : AVAILABILITY_COLORS[availability],
                      opacity: availability === 'uygun' ? 1 : 0.85,
                    }}
                    icon={<UserOutlined />}
                  />
                }
                title={
                  <Text strong={isMe} style={{ fontSize: 12.5 }} ellipsis>
                    {agent.full_name ?? agent.username}
                    {isMe ? ' (ben)' : ''}
                  </Text>
                }
                description={
                  <Tag
                    color={AVAILABILITY_COLORS[availability]}
                    style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}
                  >
                    {AVAILABILITY_LABELS[availability]}
                  </Tag>
                }
              />
            </List.Item>
          )
        }}
      />

      <Divider style={{ margin: '12px 0 8px' }}>Bugünkü İşlemler</Divider>

      <List
        size="small"
        dataSource={data?.items ?? []}
        locale={{ emptyText: <Empty description="Bugün işlem yok" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(item) => (
          <List.Item style={{ alignItems: 'flex-start', padding: '6px 0' }}>
            <List.Item.Meta
              avatar={
                item.kind === 'ticket' ? (
                  <CommentOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                ) : (
                  <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                )
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <Text strong style={{ fontSize: 12.5 }} ellipsis>
                    {item.kind === 'ticket' && item.ref ? `${item.ref} • ` : ''}
                    {item.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {formatTime(item.created_at)}
                  </Text>
                </div>
              }
              description={
                item.kind === 'ticket' && item.customer_name ? (
                  <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                    {item.customer_name}
                  </Text>
                ) : null
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
