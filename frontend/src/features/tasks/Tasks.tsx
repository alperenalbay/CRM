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
  Spin,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import {
  useChangeTaskStatus,
  useCreateTask,
  useTaskStates,
  useTasks,
  type Task,
  type TaskInput,
} from '@/api/tasks'
import { useAgents, agentDisplayName } from '@/api/tickets'
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
  title: string
  description?: string
  priority: string
  assigned_to_id?: number
  due_at?: dayjs.Dayjs
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { message } = AntApp.useApp()
  const changeStatus = useChangeTaskStatus()
  const states = useTaskStates()
  const [mutableStatus, setMutableStatus] = useState(task.status_code)

  const moveOptions = useMemo(
    () =>
      (states.data ?? [])
        .filter((state) => state.code !== task.status_code)
        .map((state) => ({ value: state.code, label: state.name })),
    [states.data, task.status_code],
  )

  const handleMove = async (statusCode: string) => {
    setMutableStatus(statusCode)
    try {
      await changeStatus.mutateAsync({ taskId: task.id, status_code: statusCode })
      message.success('Görev taşındı.')
    } catch {
      message.error('Görev taşınamadı.')
    }
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      styles={{ body: { padding: 12 } }}
      onClick={onOpen}
      hoverable
    >
      <Typography.Text strong>{task.title}</Typography.Text>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Tag color={priorityColor[task.priority] ?? 'default'}>{task.priority}</Tag>
        {task.assigned_to_name && <Tag>{task.assigned_to_name}</Tag>}
      </div>
      {task.due_at && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Bitiş: {dayjs(task.due_at).format('DD.MM.YYYY')}
        </Typography.Text>
      )}
      <div style={{ marginTop: 8 }} onClick={(event) => event.stopPropagation()}>
        <Select
          size="small"
          value={mutableStatus}
          options={moveOptions}
          onChange={handleMove}
          style={{ width: '100%' }}
          placeholder="Duruma taşı..."
        />
      </div>
    </Card>
  )
}

export default function Tasks() {
  const { message } = AntApp.useApp()
  const openTab = useTabsStore((state) => state.openTab)

  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm<CreateFormValues>()

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true)
      searchParams.delete('create')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const tasks = useTasks()
  const states = useTaskStates()
  const agents = useAgents()
  const create = useCreateTask()

  const columns = states.data ?? []

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    for (const task of tasks.data ?? []) {
      const key = task.status_code ?? 'unknown'
      grouped[key] = grouped[key] ?? []
      grouped[key].push(task)
    }
    return grouped
  }, [tasks.data])

  const agentOptions = useMemo(
    () =>
      (agents.data ?? []).map((agent) => ({
        value: agent.id,
        label: agentDisplayName(agent),
      })),
    [agents.data],
  )

  const openTaskTab = (task: Task) => {
    openTab({
      id: `task-${task.id}`,
      kind: 'task',
      title: `Görev · ${task.title}`,
      recordId: task.id,
    })
  }

  const handleCreate = async (values: CreateFormValues) => {
    try {
      const created = await create.mutateAsync({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to_id: values.assigned_to_id,
        due_at: values.due_at?.toISOString() ?? null,
      } satisfies TaskInput)
      message.success('Görev oluşturuldu.')
      setCreateOpen(false)
      createForm.resetFields()
      openTaskTab(created)
    } catch {
      message.error('Görev oluşturulamadı.')
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Görev Panosu
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Yeni Görev
        </Button>
      </Space>

      {tasks.isLoading || states.isLoading ? (
        <Spin tip="Yükleniyor..." />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
            gap: 12,
            alignItems: 'start',
          }}
        >
          {columns.map((state) => (
            <Card
              key={state.code}
              size="small"
              title={
                <Space size={6}>
                  <Tag color={state.color ?? 'default'}>{state.name}</Tag>
                  <Typography.Text type="secondary">
                    {(tasksByStatus[state.code] ?? []).length}
                  </Typography.Text>
                </Space>
              }
            >
              {(tasksByStatus[state.code] ?? []).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={() => openTaskTab(task)}
                />
              ))}
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="Yeni Görev"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={create.isPending}
        okText="Oluştur"
        cancelText="Vazgeç"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Başlık" name="title" rules={[{ required: true, message: 'Başlık girin' }]}>
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
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
