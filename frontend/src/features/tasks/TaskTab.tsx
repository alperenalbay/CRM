import { useEffect, useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useAgents, agentDisplayName } from '@/api/tickets'
import {
  useAssignTask,
  useChangeTaskStatus,
  useTaskDetail,
  useTaskStates,
  useUpdateTask,
} from '@/api/tasks'

const priorityColor: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

export default function TaskTab({ taskId }: { taskId: number }) {
  const { message } = AntApp.useApp()
  const detail = useTaskDetail(taskId)
  const states = useTaskStates()
  const agents = useAgents()
  const changeStatus = useChangeTaskStatus()
  const assign = useAssignTask()
  const update = useUpdateTask()

  const [statusOpen, setStatusOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [statusCode, setStatusCode] = useState<string | undefined>(undefined)
  const [targetUserId, setTargetUserId] = useState<number | undefined>(undefined)
  const [descriptionDraft, setDescriptionDraft] = useState<string>('')

  const task = detail.data?.task

  useEffect(() => {
    setDescriptionDraft(task?.description ?? '')
  }, [task?.description])

  const handleSaveDetail = async () => {
    try {
      await update.mutateAsync({
        taskId,
        payload: { description: descriptionDraft },
      })
      message.success('Açıklama kaydedildi.')
    } catch {
      message.error('Açıklama kaydedilemedi.')
    }
  }

  const stateOptions = useMemo(
    () =>
      (states.data ?? [])
        .filter((state) => state.code !== task?.status_code)
        .map((state) => ({ value: state.code, label: state.name })),
    [states.data, task?.status_code],
  )

  const agentOptions = useMemo(
    () =>
      (agents.data ?? []).map((agent) => ({
        value: agent.id,
        label: agentDisplayName(agent),
      })),
    [agents.data],
  )

  if (detail.isLoading || !task) {
    return (
      <Card>
        <Spin tip="Yükleniyor..." />
      </Card>
    )
  }

  const handleStatus = async () => {
    if (!statusCode) return
    try {
      await changeStatus.mutateAsync({ taskId, status_code: statusCode })
      message.success('Durum güncellendi.')
      setStatusOpen(false)
    } catch {
      message.error('Durum güncellenemedi.')
    }
  }

  const handleAssign = async () => {
    if (!targetUserId) return
    try {
      await assign.mutateAsync({ taskId, to_user_id: targetUserId })
      message.success('Görev atandı.')
      setAssignOpen(false)
    } catch {
      message.error('Atama yapılamadı.')
    }
  }

  return (
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {task.title}
        </Typography.Title>
        <Tag color={task.status_color ?? 'default'}>{task.status_name ?? task.status_code}</Tag>
        <Tag color={priorityColor[task.priority] ?? 'default'}>{task.priority}</Tag>
      </Space>

      <Descriptions
        column={{ xs: 1, sm: 2, lg: 3 }}
        size="small"
        items={[
          { key: 'assignee', label: 'Atanan', children: task.assigned_to_name ?? '-' },
          { key: 'assigner', label: 'Atayan', children: task.assigned_by_name ?? '-' },
          { key: 'due', label: 'Bitiş', children: task.due_at ? dayjs(task.due_at).format('DD.MM.YYYY HH:mm') : '-' },
          { key: 'created', label: 'Oluşturulma', children: dayjs(task.created_at).format('DD.MM.YYYY HH:mm') },
        ]}
      />

      <Divider titlePlacement="start">Açıklama / Detay</Divider>
      <Input.TextArea
        rows={4}
        value={descriptionDraft}
        onChange={(event) => setDescriptionDraft(event.target.value)}
        placeholder="Açıklama girin..."
      />
      <Space style={{ marginTop: 8 }}>
        <Button type="primary" onClick={handleSaveDetail} loading={update.isPending}>
          Detay Kaydet
        </Button>
        {descriptionDraft !== (task.description ?? '') && (
          <Button onClick={() => setDescriptionDraft(task.description ?? '')}>Vazgeç</Button>
        )}
      </Space>

      <Divider titlePlacement="start">İşlemler</Divider>
      <Space wrap>
        <Button
          onClick={() => {
            setStatusCode(undefined)
            setStatusOpen(true)
          }}
        >
          Durum Değiştir
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setTargetUserId(undefined)
            setAssignOpen(true)
          }}
        >
          Kişi Ata
        </Button>
      </Space>

      {(detail.data?.assignments.length ?? 0) > 0 && (
        <>
          <Divider titlePlacement="start">Atama Geçmişi</Divider>
          <List
            size="small"
            dataSource={detail.data?.assignments}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={`${item.user_name ?? '?'} atandı`}
                  description={`${item.assigned_by_name ?? '?'} tarafından · ${dayjs(item.assigned_at).format('DD.MM.YYYY HH:mm')}`}
                />
              </List.Item>
            )}
          />
        </>
      )}

      <Modal
        title="Durum Değiştir"
        open={statusOpen}
        onCancel={() => setStatusOpen(false)}
        onOk={handleStatus}
        confirmLoading={changeStatus.isPending}
        okButtonProps={{ disabled: !statusCode }}
        okText="Uygula"
        cancelText="Vazgeç"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Yeni durum seçin"
          options={stateOptions}
          value={statusCode}
          onChange={setStatusCode}
        />
      </Modal>

      <Modal
        title="Kişi Ata"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssign}
        confirmLoading={assign.isPending}
        okButtonProps={{ disabled: !targetUserId }}
        okText="Ata"
        cancelText="Vazgeç"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Kişi seçin"
          options={agentOptions}
          value={targetUserId}
          onChange={setTargetUserId}
        />
      </Modal>
    </Card>
  )
}
