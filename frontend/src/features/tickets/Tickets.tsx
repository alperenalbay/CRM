import { useEffect, useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { useAgents, agentDisplayName, useCreateTicket, useTicketStates, useTickets, type Ticket, type TicketFilters } from '@/api/tickets'
import { useSearchCustomers } from '@/api/customers'
import { useTabsStore } from '@/stores/tabs'

const priorityColor: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

const priorityOptions = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'critical', label: 'Kritik' },
]

interface CreateFormValues {
  subject: string
  description?: string
  customer_id: number
  priority: string
  assigned_to_id?: number
  due_at?: dayjs.Dayjs
}

export default function Tickets() {
  const { message } = AntApp.useApp()
  const openTab = useTabsStore((state) => state.openTab)

  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<TicketFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm<CreateFormValues>()
  const [customerQuery, setCustomerQuery] = useState('')

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      searchParams.delete('create')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const tickets = useTickets(filters)
  const states = useTicketStates()
  const agents = useAgents()
  const customerSearch = useSearchCustomers(customerQuery)
  const create = useCreateTicket()

  const agentOptions = useMemo(
    () =>
      (agents.data ?? []).map((agent) => ({
        value: agent.id,
        label: agentDisplayName(agent),
      })),
    [agents.data],
  )

  const stateOptions = useMemo(
    () =>
      (states.data ?? []).map((state) => ({
        value: state.code,
        label: state.name,
      })),
    [states.data],
  )

  const openTicketTab = (ticket: Ticket) => {
    openTab({
      id: `ticket-${ticket.id}`,
      kind: 'ticket',
      title: `${ticket.ticket_no} · ${ticket.subject}`,
      recordId: ticket.id,
    })
  }

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const created = await create.mutateAsync({
        customer_id: values.customer_id,
        subject: values.subject,
        description: values.description,
        priority: values.priority,
        assigned_to_id: values.assigned_to_id,
        due_at: values.due_at?.toISOString() ?? null,
      })
      message.success(`${created.ticket_no} oluşturuldu.`)
      setCreateOpen(false)
      createForm.resetFields()
      openTicketTab(created)
    } catch {
      message.error('Kayıt oluşturulamadı.')
    }
  }

  const columns: ColumnsType<Ticket> = [
    {
      title: 'No',
      dataIndex: 'ticket_no',
      width: 100,
      render: (value: string, record) => (
        <Typography.Link onClick={() => openTicketTab(record)}>{value}</Typography.Link>
      ),
    },
    { title: 'Konu', dataIndex: 'subject', ellipsis: true },
    {
      title: 'Müşteri',
      dataIndex: 'customer_name',
      width: 180,
      ellipsis: true,
      render: (value: string | null) => value ?? '-',
    },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      width: 100,
      render: (value: string) => (
        <Tag color={priorityColor[value] ?? 'default'}>{value}</Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status_name',
      width: 140,
      render: (value: string | null, record) => (
        <Tag color={record.status_color ?? 'default'}>{value ?? record.status_code}</Tag>
      ),
    },
    {
      title: 'Atanan',
      dataIndex: 'assigned_to_name',
      width: 150,
      render: (value: string | null) => value ?? '-',
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      width: 160,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button size="small" onClick={() => openTicketTab(record)}>
          Aç
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="No, konu veya müşteri ara..."
            style={{ width: 260 }}
            onSearch={(value) => setFilters((prev) => ({ ...prev, q: value || undefined }))}
            onChange={(event) => setSearchInput(event.target.value)}
            value={searchInput}
          />
          <Select
            allowClear
            placeholder="Durum"
            style={{ width: 150 }}
            options={stateOptions}
            onChange={(value) => setFilters((prev) => ({ ...prev, status_code: value }))}
          />
          <Select
            allowClear
            placeholder="Öncelik"
            style={{ width: 130 }}
            options={priorityOptions}
            onChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
          />
          <Select
            allowClear
            placeholder="Atanan"
            style={{ width: 180 }}
            options={agentOptions}
            onChange={(value) => setFilters((prev) => ({ ...prev, assigned_to: value }))}
          />
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Yeni Kayıt
          </Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tickets.data}
          loading={tickets.isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="middle"
        />
      </Card>

      <Modal
        title="Yeni Destek Kaydı"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={create.isPending}
        okText="Oluştur"
        cancelText="Vazgeç"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Müşteri" name="customer_id" rules={[{ required: true, message: 'Müşteri seçin' }]}>
            <Select
              showSearch
              placeholder="Müşteri ara..."
              filterOption={false}
              onSearch={(value) => setCustomerQuery(value)}
              notFoundContent={customerSearch.isFetching ? 'Aranıyor...' : 'Sonuç yok'}
              options={(customerSearch.data ?? []).map((customer) => ({
                value: customer.id,
                label: `${customer.customer_code} — ${customer.company_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Konu" name="subject" rules={[{ required: true, message: 'Konu girin' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Öncelik" name="priority" initialValue="medium">
            <Select options={priorityOptions} />
          </Form.Item>
          <Form.Item label="Atanacak Kişi" name="assigned_to_id">
            <Select allowClear options={agentOptions} />
          </Form.Item>
          <Form.Item label="Bitiş Tarihi" name="due_at">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
