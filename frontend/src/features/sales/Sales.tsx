import { useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useCreateOrder,
  useCreateProduct,
  useDeactivateProduct,
  useOrderDetail,
  useOrders,
  useProducts,
  useUpdateOrderStatus,
  useUpdateProduct,
  type OrderInput,
  type Product,
  type ProductInput,
  type SalesOrder,
} from '@/api/sales'
import { useSearchCustomers } from '@/api/customers'

const statusColor: Record<string, string> = {
  draft: 'default',
  confirmed: 'blue',
  invoiced: 'purple',
  completed: 'green',
  cancelled: 'red',
}

const statusOptions = [
  { value: 'draft', label: 'Taslak' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'invoiced', label: 'Faturalandı' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
]

function OrdersTab() {
  const { message } = AntApp.useApp()
  const [createOpen, setCreateOpen] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const orders = useOrders()
  const products = useProducts()
  const customerSearch = useSearchCustomers(customerQuery)
  const create = useCreateOrder()
  const updateStatus = useUpdateOrderStatus()
  const detail = useOrderDetail(detailId)

  const productSelectOptions = (products.data ?? [])
    .filter((product) => product.is_active)
    .map((product) => ({
      value: product.id,
      label: `${product.code} — ${product.name} (${product.unit_price.toLocaleString('tr-TR')} ₺)`,
    }))

  const handleCreate = async (values: { customer_id: number; items: { product_id: number; quantity: number; unit_price?: number }[] }) => {
    const items = (values.items ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price ?? undefined,
    }))
    try {
      await create.mutateAsync({
        customer_id: values.customer_id,
        status: 'draft',
        items,
      } satisfies OrderInput)
      message.success('Satış emri oluşturuldu.')
      setCreateOpen(false)
      form.resetFields()
    } catch {
      message.error('Satış emri oluşturulamadı.')
    }
  }

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status })
      message.success('Durum güncellendi.')
    } catch {
      message.error('Durum güncellenemedi.')
    }
  }

  const columns: ColumnsType<SalesOrder> = [
    { title: 'No', dataIndex: 'order_no', width: 110 },
    { title: 'Müşteri', dataIndex: 'customer_name', render: (value: string | null) => value ?? '-' },
    { title: 'Tarih', dataIndex: 'order_date', width: 110, render: (value: string) => dayjs(value).format('DD.MM.YYYY') },
    { title: 'Tutar', dataIndex: 'total_amount', width: 120, render: (value: number) => `${value.toLocaleString('tr-TR')} ₺` },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 160,
      render: (value: string, record) => (
        <Select
          size="small"
          value={value}
          options={statusOptions}
          onChange={(next) => handleStatusChange(record.id, next)}
          style={{ width: 140 }}
        />
      ),
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => {
            setDetailId(record.id)
            setDetailOpen(true)
          }}
        >
          Detay
        </Button>
      ),
    },
  ]

  const detailItems = detail.data?.items ?? []

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Satış Emirleri
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Yeni Emir
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={orders.data}
        loading={orders.isLoading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
      />

      <Modal
        title="Yeni Satış Emri"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
        okText="Oluştur"
        cancelText="Vazgeç"
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Müşteri" name="customer_id" rules={[{ required: true, message: 'Müşteri seçin' }]}>
            <Select
              showSearch
              placeholder="Müşteri ara..."
              filterOption={false}
              onSearch={setCustomerQuery}
              notFoundContent={customerSearch.isFetching ? 'Aranıyor...' : 'Sonuç yok'}
              options={(customerSearch.data ?? []).map((customer) => ({
                value: customer.id,
                label: `${customer.customer_code} — ${customer.company_name}`,
              }))}
            />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                    <Form.Item
                      name={[field.name, 'product_id']}
                      rules={[{ required: true, message: 'Ürün' }]}
                      style={{ flex: 2 }}
                    >
                      <Select placeholder="Ürün seçin" options={productSelectOptions} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'quantity']}
                      rules={[{ required: true, message: 'Adet' }]}
                      initialValue={1}
                      style={{ width: 90 }}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'unit_price']} style={{ width: 120 }}>
                      <InputNumber placeholder="Fiyat" min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Ürün Ekle
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={detail.data ? `${detail.data.order_no} · ${detail.data.customer_name ?? ''}` : 'Detay'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
      >
        {detail.data && (
          <div>
            <Space style={{ marginBottom: 12 }}>
              <Tag color={statusColor[detail.data.status] ?? 'default'}>{detail.data.status}</Tag>
              <Typography.Text type="secondary">
                {dayjs(detail.data.order_date).format('DD.MM.YYYY')} · {detail.data.created_by_name ?? ''}
              </Typography.Text>
            </Space>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Ürün', dataIndex: 'product_name', render: (v: string | null) => v ?? '-' },
                { title: 'Adet', dataIndex: 'quantity', width: 80 },
                { title: 'Birim Fiyat', dataIndex: 'unit_price', width: 110, render: (v: number) => v.toLocaleString('tr-TR') },
                { title: 'Tutar', dataIndex: 'line_total', width: 110, render: (v: number) => `${v.toLocaleString('tr-TR')} ₺` },
              ]}
              dataSource={detailItems}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Typography.Text strong>Toplam</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Typography.Text strong>
                      {detail.data.total_amount.toLocaleString('tr-TR')} ₺
                    </Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

function ProductsTab() {
  const { message } = AntApp.useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form] = Form.useForm()
  const products = useProducts()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const deactivate = useDeactivateProduct()

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    form.setFieldsValue({
      code: product.code,
      name: product.name,
      unit_price: product.unit_price,
      vat_rate: product.vat_rate,
      unit: product.unit,
    })
    setOpen(true)
  }

  const handleSubmit = async (values: ProductInput) => {
    try {
      if (editing) {
        await update.mutateAsync({ productId: editing.id, payload: values })
        message.success('Ürün güncellendi.')
      } else {
        await create.mutateAsync(values)
        message.success('Ürün eklendi.')
      }
      setOpen(false)
      form.resetFields()
    } catch {
      message.error(editing ? 'Ürün güncellenemedi.' : 'Ürün eklenemedi.')
    }
  }

  const handleDeactivate = async (product: Product) => {
    try {
      if (product.is_active) {
        await deactivate.mutateAsync(product.id)
        message.success('Ürün pasife alındı.')
      } else {
        await update.mutateAsync({ productId: product.id, payload: { is_active: true } })
        message.success('Ürün aktife alındı.')
      }
    } catch {
      message.error('İşlem yapılamadı.')
    }
  }

  const columns: ColumnsType<Product> = [
    { title: 'Kod', dataIndex: 'code', width: 110 },
    { title: 'Ad', dataIndex: 'name' },
    { title: 'Birim Fiyat', dataIndex: 'unit_price', width: 130, render: (value: number) => `${value.toLocaleString('tr-TR')} ₺` },
    { title: 'KDV %', dataIndex: 'vat_rate', width: 90, render: (value: number) => `%${value}` },
    { title: 'Birim', dataIndex: 'unit', width: 90, render: (value: string | null) => value ?? '-' },
    {
      title: 'Durum',
      dataIndex: 'is_active',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Aktif' : 'Pasif'}</Tag>
      ),
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" onClick={() => openEdit(record)}>
            Düzenle
          </Button>
          <Popconfirm
            title={record.is_active ? 'Ürünü pasife al?' : 'Ürünü aktife al?'}
            okText="Evet"
            cancelText="Vazgeç"
            onConfirm={() => handleDeactivate(record)}
          >
            <Button size="small" danger={record.is_active}>
              {record.is_active ? 'Pasife Al' : 'Aktife Al'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Ürünler
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Yeni Ürün
        </Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={products.data} loading={products.isLoading} pagination={false} />

      <Modal
        title={editing ? 'Ürün Düzenle' : 'Yeni Ürün'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending || update.isPending}
        okText="Kaydet"
        cancelText="Vazgeç"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ vat_rate: 20 }}>
          <Form.Item label="Kod" name="code" rules={[{ required: true, message: 'Kod girin' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Ad" name="name" rules={[{ required: true, message: 'Ad girin' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Birim Fiyat" name="unit_price" rules={[{ required: true, message: 'Fiyat girin' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="KDV %" name="vat_rate">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Birim" name="unit">
            <Input placeholder="adet / saat / gün" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function Sales() {
  return (
    <Card>
      <Tabs
        items={[
          { key: 'orders', label: 'Satış Emirleri', children: <OrdersTab /> },
          { key: 'products', label: 'Ürünler', children: <ProductsTab /> },
        ]}
      />
    </Card>
  )
}
