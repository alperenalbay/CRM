import { useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useCreateCustomer,
  useCustomerHistory,
  useSearchCustomers,
  type Customer,
  type CustomerInput,
} from '@/api/customers'
import { useAuthStore } from '@/stores/authStore'
import { HistoryPanel } from './HistoryPanel'

export default function Customers() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [form] = Form.useForm<CustomerInput>()
  const { message } = AntApp.useApp()
  const canCreate = useAuthStore((s) => s.can('customers.create'))

  const search = useSearchCustomers(query)
  const history = useCustomerHistory(selected?.id ?? null)
  const create = useCreateCustomer()

  const handleSelect = (customerId: number) => {
    const customer = search.data?.find((item) => item.id === customerId) ?? null
    setSelected(customer)
    if (customer) {
      form.setFieldsValue({
        company_name: customer.company_name,
        customer_type: customer.customer_type,
        tax_no: customer.tax_no,
        tax_office: customer.tax_office,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        address: customer.address,
        city: customer.city,
        district: customer.district,
        country: customer.country,
        notes: customer.notes,
      })
    }
  }

  const handleNew = () => {
    setSelected(null)
    form.resetFields()
  }

  const handleSubmit = async (values: CustomerInput) => {
    try {
      const created = await create.mutateAsync(values)
      message.success(`Müşteri kaydedildi: ${created.customer_code}`)
      handleNew()
    } catch {
      message.error('Müşteri kaydedilemedi.')
    }
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'Kod',
      dataIndex: 'customer_code',
      width: 120,
    },
    {
      title: 'Firma / Ad',
      dataIndex: 'company_name',
      ellipsis: true,
    },
    {
      title: 'Tip',
      dataIndex: 'customer_type',
      width: 110,
      render: (value: string) => (
        <Tag color={value === 'company' ? 'blue' : 'default'}>
          {value === 'company' ? 'Kurumsal' : 'Bireysel'}
        </Tag>
      ),
    },
    {
      title: 'Şehir',
      dataIndex: 'city',
      width: 120,
      render: (value: string | null) => value ?? '-',
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      width: 140,
      render: (value: string | null) => value ?? '-',
    },
  ]

  return (
    <div>
      <Card title="Müşteri Listesi">
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Ad, kod, vergi no, e-posta ara..."
            style={{ width: 340 }}
            onSearch={(value) => setQuery(value)}
            onChange={(event) => setQuery(event.target.value)}
          />
          {canCreate && <Button onClick={handleNew}>Yeni Müşteri</Button>}
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={search.data}
          loading={search.isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
          rowClassName={(record) => (record.id === selected?.id ? 'ant-table-row-selected' : '')}
          onRow={(record) => ({
            onClick: () => handleSelect(record.id),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="Müşteri Geçmişi">
            {selected ? (
              <HistoryPanel history={history.data} loading={history.isLoading} />
            ) : (
              <Typography.Text type="secondary">
                Geçmiş kayıtları görmek için bir müşteri seçin.
              </Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={
              selected
                ? `${selected.customer_code} — ${selected.company_name}`
                : 'Yeni Müşteri'
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ customer_type: 'company', country: 'Türkiye' }}
            >
              <Row gutter={12}>
                <Col span={16}>
                  <Form.Item
                    label="Firma / Ad"
                    name="company_name"
                    rules={[{ required: true, message: 'Firma adı girin' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Tip" name="customer_type">
                    <Select
                      options={[
                        { value: 'company', label: 'Kurumsal' },
                        { value: 'individual', label: 'Bireysel' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Vergi No" name="tax_no">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Vergi Dairesi" name="tax_office">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="E-posta" name="email">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Telefon" name="phone">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Cep Telefonu" name="mobile">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Ülke" name="country">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Şehir" name="city">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="İlçe" name="district">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Adres" name="address">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Notlar" name="notes">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              {canCreate && (
                <Button type="primary" htmlType="submit" loading={create.isPending}>
                  {selected ? 'Güncelle' : 'Kaydet'}
                </Button>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
