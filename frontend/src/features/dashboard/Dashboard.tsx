import { Card, Col, Row, Statistic, Table, Tag, Typography } from 'antd'
import {
  CheckSquareOutlined,
  CustomerServiceOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useDashboardSummary } from '@/api/dashboard'
import type { Ticket } from '@/api/tickets'

const priorityColor: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

export default function Dashboard() {
  const summary = useDashboardSummary()
  const data = summary.data

  const recentColumns: ColumnsType<Ticket> = [
    { title: 'No', dataIndex: 'ticket_no', width: 110 },
    { title: 'Konu', dataIndex: 'subject', ellipsis: true },
    { title: 'Müşteri', dataIndex: 'customer_name', render: (value: string | null) => value ?? '-' },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      width: 100,
      render: (value: string) => <Tag color={priorityColor[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: 'Durum',
      dataIndex: 'status_name',
      width: 120,
      render: (value: string | null, record) => (
        <Tag color={record.status_color ?? 'default'}>{value ?? record.status_code}</Tag>
      ),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      width: 150,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col xs={12} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic title="Müşteri" value={data?.customer_count ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic
              title="Açık Kayıt"
              value={data?.open_ticket_count ?? 0}
              prefix={<CustomerServiceOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic
              title="Kapalı Kayıt"
              value={data?.closed_ticket_count ?? 0}
              prefix={<CustomerServiceOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic
              title="Açık Görev"
              value={data?.open_task_count ?? 0}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic
              title="Toplam Satış"
              value={data?.sales_total ?? 0}
              precision={2}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8} lg={4}>
          <Card loading={summary.isLoading}>
            <Statistic title="Satış Emri" value={data?.order_count ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card title="Son Destek Kayıtları" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={recentColumns}
          dataSource={data?.recent_tickets ?? []}
          loading={summary.isLoading}
          pagination={false}
          size="small"
        />
        {(data?.recent_tickets.length ?? 0) === 0 && (
          <Typography.Text type="secondary">Henüz kayıt yok.</Typography.Text>
        )}
      </Card>
    </div>
  )
}
