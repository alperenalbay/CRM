import { Empty, List, Space, Tag, Typography } from 'antd'
import type { CustomerHistory } from '@/api/customers'

const priorityColor: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

interface HistoryPanelProps {
  history?: CustomerHistory
  loading: boolean
}

export function HistoryPanel({ history, loading }: HistoryPanelProps) {
  if (loading) {
    return <Typography.Text type="secondary">Yükleniyor...</Typography.Text>
  }
  if (!history || (history.tickets.length === 0 && history.orders.length === 0)) {
    return <Empty description="Bu müşterinin kaydı yok" />
  }
  return (
    <div>
      {history.tickets.length > 0 && (
        <>
          <Typography.Text strong>Destek Kayıtları</Typography.Text>
          <List
            size="small"
            dataSource={history.tickets}
            renderItem={(ticket) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space size={4}>
                      <Typography.Text strong>{ticket.ticket_no}</Typography.Text>
                      <Tag color={priorityColor[ticket.priority] ?? 'default'}>
                        {ticket.priority}
                      </Tag>
                    </Space>
                  }
                  description={`${ticket.subject} — ${ticket.status_name ?? 'Durum yok'}`}
                />
              </List.Item>
            )}
          />
        </>
      )}
      {history.orders.length > 0 && (
        <>
          <Typography.Text strong>Satışlar</Typography.Text>
          <List
            size="small"
            dataSource={history.orders}
            renderItem={(order) => (
              <List.Item>
                <List.Item.Meta
                  title={order.order_no}
                  description={`${order.order_date} — ${order.status} — ${order.total_amount}`}
                />
              </List.Item>
            )}
          />
        </>
      )}
    </div>
  )
}
