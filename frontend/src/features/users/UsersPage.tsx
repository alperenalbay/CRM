import { useMemo, useState } from 'react'
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import {
  useCreatePermissionGroup,
  useCreateUser,
  usePermissionGroups,
  usePermissions,
  useRoles,
  useUpdatePermissionGroup,
  useUpdateUser,
  useUsers,
  type PermissionGroupOut,
  type UserOut,
} from '@/api/users'
import { useAuthStore } from '@/stores/authStore'
import type { DefaultOptionType } from 'antd/es/select'

const ROLE_GROUP_MAP: Record<string, string> = {
  support: 'destek_uzmani',
  sales: 'satis_temsilcisi',
}

interface UserFormValues {
  username: string
  full_name?: string
  email?: string
  password?: string
  role_code: string
  group_ids: number[]
  is_active?: boolean
}

interface GroupFormValues {
  code: string
  name: string
  description?: string
  permission_codes: string[]
  user_ids: number[]
}

function UserTable() {
  const { message } = AntApp.useApp()
  const users = useUsers()
  const roles = useRoles()
  const groups = usePermissionGroups()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const canCreate = useAuthStore((s) => s.can('users.create'))
  const canUpdate = useAuthStore((s) => s.can('users.update'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserOut | null>(null)
  const [form] = Form.useForm<UserFormValues>()

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (user: UserOut) => {
    setEditing(user)
    form.setFieldsValue({
      full_name: user.full_name ?? undefined,
      email: user.email ?? undefined,
      role_code: user.role ?? undefined,
      group_ids: groups.data
        ?.filter((g) => user.groups.includes(g.name))
        .map((g) => g.id) ?? [],
      is_active: user.is_active,
    })
    setModalOpen(true)
  }

  const handleRoleChange = (roleCode: string) => {
    const defaultGroup = groups.data?.find((g) => g.code === ROLE_GROUP_MAP[roleCode])
    if (defaultGroup) {
      const current = (form.getFieldValue('group_ids') ?? []) as number[]
      if (!current.includes(defaultGroup.id)) {
        form.setFieldsValue({ group_ids: [...current, defaultGroup.id] })
      }
    }
  }

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (editing) {
        await updateUser.mutateAsync({
          id: editing.id,
          payload: {
            full_name: values.full_name,
            email: values.email,
            password: values.password || null,
            role_code: values.role_code,
            group_ids: values.group_ids,
            is_active: values.is_active,
          },
        })
        message.success('Kullanıcı güncellendi.')
      } else {
        await createUser.mutateAsync({
          username: values.username,
          full_name: values.full_name,
          email: values.email,
          password: values.password ?? '',
          role_code: values.role_code,
          group_ids: values.group_ids,
        })
        message.success('Kullanıcı oluşturuldu.')
      }
      setModalOpen(false)
    } catch {
      message.error('Kullanıcı kaydedilemedi.')
    }
  }

  const handleToggleActive = async (user: UserOut) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        payload: { is_active: !user.is_active },
      })
      message.success(user.is_active ? 'Kullanıcı pasifleştirildi.' : 'Kullanıcı aktifleştirildi.')
    } catch {
      message.error('Durum güncellenemedi.')
    }
  }

  const columns: ColumnsType<UserOut> = [
    {
      title: 'Kullanıcı Adı',
      dataIndex: 'username',
      render: (value: string, record) => (
        <Space>
          <span>{value}</span>
          {!record.is_active && <Tag color="red">Pasif</Tag>}
        </Space>
      ),
    },
    { title: 'Ad Soyad', dataIndex: 'full_name', render: (v: string | null) => v ?? '—' },
    { title: 'E-posta', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
    {
      title: 'Rol',
      dataIndex: 'role',
      render: (value: string | null) => {
        const role = roles.data?.find((r) => r.code === value)
        return role ? role.name : value ?? '—'
      },
    },
    {
      title: 'Gruplar',
      dataIndex: 'groups',
      render: (values: string[]) => (
        <Space size={[0, 4]} wrap>
          {values.length === 0 ? '—' : values.map((g) => <Tag key={g}>{g}</Tag>)}
        </Space>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'is_active',
      render: (value: boolean) =>
        value ? <Badge status="success" text="Aktif" /> : <Badge status="error" text="Pasif" />,
    },
    {
      title: 'İşlem',
      width: 220,
      render: (_, record) => (
        <Space>
          {canUpdate && <Button size="small" onClick={() => openEdit(record)}>Düzenle</Button>}
          {canUpdate && (
            <Button size="small" danger={record.is_active} onClick={() => handleToggleActive(record)}>
              {record.is_active ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="Kullanıcılar"
      extra={
        canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni Kullanıcı
          </Button>
        )
      }
    >
      <Table
        rowKey="id"
        loading={users.isLoading}
        dataSource={users.data ?? []}
        columns={columns}
        pagination={{ pageSize: 20 }}
      />
      <Modal
        title={editing ? `Kullanıcı Düzenle: ${editing.username}` : 'Yeni Kullanıcı'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createUser.isPending || updateUser.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ role_code: 'support', group_ids: [] }}
        >
          {!editing && (
            <Form.Item
              label="Kullanıcı Adı"
              name="username"
              rules={[{ required: true, min: 3, message: 'En az 3 karakter' }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Ad Soyad" name="full_name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="E-posta" name="email">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label={editing ? 'Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}
            name="password"
            rules={editing ? [] : [{ required: true, min: 6, message: 'En az 6 karakter' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Rol"
            name="role_code"
            rules={[{ required: true, message: 'Rol seçin' }]}
          >
            <Select
              options={roles.data?.map((r) => ({ value: r.code, label: r.name }))}
              onChange={(value: string) => handleRoleChange(value)}
            />
          </Form.Item>
          <Form.Item label="Yetki Grupları" name="group_ids">
            <Select
              mode="multiple"
              placeholder="Yetki gruplarını seçin"
              options={groups.data
                ?.filter((g) => g.is_active)
                .map((g) => ({ value: g.id, label: g.name }))}
              optionRender={(option: DefaultOptionType) => {
                const group = groups.data?.find((g) => g.id === option.value)
                return (
                  <div>
                    <div>{option.label}</div>
                    {group?.description && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {group.description}
                      </Typography.Text>
                    )}
                  </div>
                )
              }}
            />
          </Form.Item>
          {editing && (
            <Form.Item label="Durum" name="is_active" valuePropName="checked">
              <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}

function GroupTable() {
  const { message } = AntApp.useApp()
  const groups = usePermissionGroups()
  const permissions = usePermissions()
  const users = useUsers()
  const createGroup = useCreatePermissionGroup()
  const updateGroup = useUpdatePermissionGroup()
  const canManage = useAuthStore((s) => s.can('groups.manage'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PermissionGroupOut | null>(null)
  const [form] = Form.useForm<GroupFormValues>()

  const permissionsByModule = useMemo(() => {
    const map = new Map<string, { code: string; name: string }[]>()
    for (const p of permissions.data ?? []) {
      const list = map.get(p.module) ?? []
      list.push(p)
      map.set(p.module, list)
    }
    return [...map.entries()]
  }, [permissions.data])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (group: PermissionGroupOut) => {
    setEditing(group)
    form.setFieldsValue({
      name: group.name,
      description: group.description ?? undefined,
      permission_codes: group.permissions.map((p) => p.code),
      user_ids: group.user_ids,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (values: GroupFormValues) => {
    try {
      if (editing) {
        await updateGroup.mutateAsync({
          id: editing.id,
          payload: {
            name: values.name,
            description: values.description,
            permission_codes: values.permission_codes,
            user_ids: values.user_ids,
          },
        })
        message.success('Yetki grubu güncellendi.')
      } else {
        await createGroup.mutateAsync({
          code: values.code,
          name: values.name,
          description: values.description,
          permission_codes: values.permission_codes,
          user_ids: values.user_ids,
        })
        message.success('Yetki grubu oluşturuldu.')
      }
      setModalOpen(false)
    } catch {
      message.error('Yetki grubu kaydedilemedi.')
    }
  }

  const columns: ColumnsType<PermissionGroupOut> = [
    { title: 'Kod', dataIndex: 'code', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Ad', dataIndex: 'name' },
    { title: 'Açıklama', dataIndex: 'description', render: (v: string | null) => v ?? '—' },
    { title: 'Yetki Sayısı', dataIndex: 'permissions', render: (v: { code: string }[]) => v.length },
    { title: 'Kullanıcı Sayısı', dataIndex: 'user_ids', render: (v: number[]) => v.length },
    {
      title: 'Durum',
      dataIndex: 'is_active',
      render: (value: boolean) =>
        value ? <Badge status="success" text="Aktif" /> : <Badge status="error" text="Pasif" />,
    },
    {
      title: 'İşlem',
      width: 120,
      render: (_, record) =>
        canManage && <Button size="small" onClick={() => openEdit(record)}>Düzenle</Button>,
    },
  ]

  return (
    <Card
      title="Yetki Grupları"
      extra={
        canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni Grup
          </Button>
        )
      }
    >
      <Table
        rowKey="id"
        loading={groups.isLoading}
        dataSource={groups.data ?? []}
        columns={columns}
        pagination={false}
      />
      <Modal
        title={editing ? `Yetki Grubu Düzenle: ${editing.name}` : 'Yeni Yetki Grubu'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createGroup.isPending || updateGroup.isPending}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ permission_codes: [], user_ids: [] }}>
          {!editing && (
            <Form.Item
              label="Kod"
              name="code"
              rules={[
                { required: true, min: 2, message: 'En az 2 karakter' },
                { pattern: /^[a-z0-9_]+$/, message: 'Küçük harf, rakam ve alt çizgi kullanın' },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>
          )}
          <Form.Item label="Ad" name="name" rules={[{ required: true, message: 'Grup adı girin' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Typography.Text strong>Yetkiler</Typography.Text>
          {permissionsByModule.map(([module, perms]) => (
            <div key={module} style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">{module}</Typography.Text>
              <Form.Item name="permission_codes" valuePropName="value" style={{ marginBottom: 4 }}>
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  options={perms.map((p) => ({ value: p.code, label: p.name }))}
                />
              </Form.Item>
            </div>
          ))}
          <Form.Item label="Kullanıcılar" name="user_ids">
            <Select
              mode="multiple"
              placeholder="Bu gruba atanacak kullanıcılar"
              options={users.data?.map((u) => ({
                value: u.id,
                label: `${u.username}${u.full_name ? ` — ${u.full_name}` : ''}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default function UsersPage() {
  const me = useAuthStore((s) => s.me)
  const canView = useAuthStore((s) => s.can('users.view'))

  if (me && !canView) {
    return (
      <Card>
        <Typography.Text type="secondary">
          Bu sayfaya erişim yetkiniz yok.
        </Typography.Text>
      </Card>
    )
  }

  return (
    <Tabs
      items={[
        { key: 'users', label: 'Kullanıcılar', children: <UserTable /> },
        { key: 'groups', label: 'Yetki Grupları', children: <GroupTable /> },
      ]}
    />
  )
}
