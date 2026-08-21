import { useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import {
  useAddComment,
  useAgents,
  agentDisplayName,
  useChangeStatus,
  useTicketDetail,
  useTicketStates,
  useTransferTicket,
} from '@/api/tickets'

const priorityColor: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

const actionColor: Record<string, string> = {
  created: 'blue',
  status_changed: 'orange',
  transferred: 'purple',
  assigned: 'cyan',
  comment: 'green',
}

interface StatusFormValues {
  status_code: string
  comment?: string
}

interface TransferFormValues {
  to_user_id: number
  reason?: string
}

interface CommentFormValues {
  comment: string
}

export default function TicketTab({ ticketId }: { ticketId: number }) {
  const { message } = AntApp.useApp()
  const detail = useTicketDetail(ticketId)
  const states = useTicketStates()
  const agents = useAgents()
  const changeStatus = useChangeStatus()
  const transfer = useTransferTicket()
  const addComment = useAddComment()

  const [statusOpen, setStatusOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [statusForm] = Form.useForm<StatusFormValues>()
  const [transferForm] = Form.useForm<TransferFormValues>()
  const [commentForm] = Form.useForm<CommentFormValues>()

  const ticket = detail.data?.ticket

  const stateOptions = useMemo(
    () =>
      (states.data ?? [])
        .filter((state) => state.code !== ticket?.status_code)
        .map((state) => ({ value: state.code, label: state.name })),
    [states.data, ticket?.status_code],
  )

  const agentOptions = useMemo(
    () =>
      (agents.data ?? []).map((agent) => ({
        value: agent.id,
        label: agentDisplayName(agent),
      })),
    [agents.data],
  )

  const timelineItems = useMemo(() => {
    const detailData = detail.data
    if (!detailData) return []
    const events: { at: string; type: string; user: string | null; desc: string }[] = [
      ...detailData.activities.map((activity) => ({
        at: activity.created_at,
        type: activity.action,
        user: activity.user_name,
        desc: activity.detail ?? '',
      })),
      ...detailData.transfers.map((transferEvent) => ({
        at: transferEvent.transferred_at,
        type: 'transferred',
        user: transferEvent.transferred_by_name,
        desc: `${transferEvent.from_user_name ?? '?'} → ${transferEvent.to_user_name}${transferEvent.reason ? ` (${transferEvent.reason})` : ''}`,
      })),
      ...detailData.status_history.map((entry) => ({
        at: entry.created_at,
        type: 'status_changed',
        user: entry.changed_by_name,
        desc: `${entry.from_status_name ?? '?'} → ${entry.to_status_name}${entry.comment ? ` — ${entry.comment}` : ''}`,
      })),
    ]
    return events
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .map((event) => ({
        color: actionColor[event.type] ?? 'gray',
        children: (
          <div>
            <Space size={6}>
              <Tag color={actionColor[event.type] ?? 'default'} style={{ marginInlineEnd: 0 }}>
                {event.type}
              </Tag>
              <Typography.Text type="secondary">
                {event.user ?? 'Sistem'} · {dayjs(event.at).format('DD.MM.YYYY HH:mm')}
              </Typography.Text>
            </Space>
            <div style={{ marginTop: 4 }}>{event.desc}</div>
          </div>
        ),
      }))
  }, [detail.data])

  if (detail.isLoading || !ticket) {
    return (
      <Card>
        <Spin tip="Yükleniyor..." />
      </Card>
    )
  }

  const handleChangeStatus = async (values: StatusFormValues) => {
    try {
      await changeStatus.mutateAsync({
        ticketId,
        status_code: values.status_code,
        comment: values.comment,
      })
      message.success('Durum güncellendi.')
      setStatusOpen(false)
      statusForm.resetFields()
    } catch {
      message.error('Durum güncellenemedi.')
    }
  }

  const handleTransfer = async (values: TransferFormValues) => {
    try {
      await transfer.mutateAsync({
        ticketId,
        to_user_id: values.to_user_id,
        reason: values.reason,
      })
      message.success('Kayıt devredildi.')
      setTransferOpen(false)
      transferForm.resetFields()
    } catch {
      message.error('Devir gerçekleştirilemedi.')
    }
  }

  const handleComment = async (values: CommentFormValues) => {
    try {
      await addComment.mutateAsync({ ticketId, comment: values.comment })
      message.success('Yorum eklendi.')
      setCommentOpen(false)
      commentForm.resetFields()
    } catch {
      message.error('Yorum eklenemedi.')
    }
  }

  return (
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {ticket.ticket_no} · {ticket.subject}
        </Typography.Title>
        <Tag color={ticket.status_color ?? 'default'}>{ticket.status_name ?? ticket.status_code}</Tag>
        <Tag color={priorityColor[ticket.priority] ?? 'default'}>{ticket.priority}</Tag>
      </Space>

      <Descriptions
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        items={[
          { key: 'customer', label: 'Müşteri', children: ticket.customer_name ?? '-' },
          { key: 'assignee', label: 'Atanan', children: ticket.assigned_to_name ?? '-' },
          { key: 'creator', label: 'Oluşturan', children: ticket.created_by_name ?? '-' },
          {
            key: 'created_at',
            label: 'Oluşturulma',
            children: dayjs(ticket.created_at).format('DD.MM.YYYY HH:mm'),
          },
          { key: 'due_at', label: 'Bitiş', children: ticket.due_at ? dayjs(ticket.due_at).format('DD.MM.YYYY HH:mm') : '-' },
          { key: 'closed_at', label: 'Kapanış', children: ticket.closed_at ? dayjs(ticket.closed_at).format('DD.MM.YYYY HH:mm') : '-' },
        ]}
      />

      {ticket.description && (
        <>
          <Divider titlePlacement="start">Açıklama</Divider>
          <Typography.Paragraph>{ticket.description}</Typography.Paragraph>
        </>
      )}

      <Divider titlePlacement="start">İşlemler</Divider>
      <Space wrap>
        <Button
          onClick={() => {
            statusForm.resetFields()
            setStatusOpen(true)
          }}
        >
          Durum Değiştir
        </Button>
        <Button
          onClick={() => {
            transferForm.resetFields()
            setTransferOpen(true)
          }}
        >
          Devret
        </Button>
        <Button
          type="primary"
          onClick={() => {
            commentForm.resetFields()
            setCommentOpen(true)
          }}
        >
          Yorum Ekle
        </Button>
      </Space>

      <Divider titlePlacement="start">Geçmiş</Divider>
      <Timeline items={timelineItems} />

      <Modal
        title="Durum Değiştir"
        open={statusOpen}
        onCancel={() => setStatusOpen(false)}
        onOk={() => statusForm.submit()}
        confirmLoading={changeStatus.isPending}
        okText="Uygula"
        cancelText="Vazgeç"
      >
        <Form form={statusForm} layout="vertical" onFinish={handleChangeStatus}>
          <Form.Item label="Yeni Durum" name="status_code" rules={[{ required: true, message: 'Durum seçin' }]}>
            <Select options={stateOptions} />
          </Form.Item>
          <Form.Item label="Açıklama" name="comment">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Kaydı Devret"
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={() => transferForm.submit()}
        confirmLoading={transfer.isPending}
        okText="Devret"
        cancelText="Vazgeç"
      >
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
          <Form.Item label="Devredilecek Kişi" name="to_user_id" rules={[{ required: true, message: 'Kişi seçin' }]}>
            <Select options={agentOptions} />
          </Form.Item>
          <Form.Item label="Gerekçe" name="reason">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Yorum Ekle"
        open={commentOpen}
        onCancel={() => setCommentOpen(false)}
        onOk={() => commentForm.submit()}
        confirmLoading={addComment.isPending}
        okText="Ekle"
        cancelText="Vazgeç"
      >
        <Form form={commentForm} layout="vertical" onFinish={handleComment}>
          <Form.Item label="Yorum" name="comment" rules={[{ required: true, message: 'Yorum yazın' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
