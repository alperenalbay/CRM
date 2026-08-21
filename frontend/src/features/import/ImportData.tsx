import { useEffect, useRef, useState } from 'react'
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import {
  useImportBatches,
  useImportPreview,
  useRunImport,
  type ImportBatch,
  type ImportPreview,
} from '@/api/importData'

const TEMPLATE_HEADERS = [
  'company_name',
  'customer_type',
  'tax_no',
  'tax_office',
  'email',
  'phone',
  'mobile',
  'city',
  'district',
  'address',
  'country',
  'notes',
]

function downloadTemplate() {
  const example =
    'Acme Bilişim Ltd. Şti.,company,1234567890,Istanbul,info@acme.com,02125554433,05331234567,Istanbul,Kadıköy,Acıbadem Cad. No:1,Türkiye,Lisans müşterisi'
  const blob = new Blob([[TEMPLATE_HEADERS.join(','), example].join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'musteri-import-sablonu.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

const statusColor: Record<string, string> = {
  completed: 'green',
  running: 'blue',
  failed: 'red',
  pending: 'default',
}

export default function ImportData() {
  const { message } = AntApp.useApp()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportBatch | null>(null)
  const fileListRef = useRef<UploadFile[]>([])

  const previewMutation = useImportPreview()
  const runMutation = useRunImport()
  const batches = useImportBatches()

  useEffect(() => {
    if (!selectedFile) return
    previewMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setPreview(data)
        setResult(null)
      },
      onError: () => {
        setPreview(null)
        message.error('Dosya önizlenemedi.')
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile])

  const handleSelect = (file: UploadFile) => {
    const raw = file.originFileObj ?? file
    if (raw instanceof File) {
      setSelectedFile(raw)
      fileListRef.current = [file]
    }
    return false
  }

  const handleRun = () => {
    if (!selectedFile) return
    runMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data)
        batches.refetch()
        message.success('Import tamamlandı.')
      },
      onError: () => message.error('Import başarısız.'),
    })
  }

  const sampleColumns =
    preview?.columns.map((column) => ({
      title: column,
      dataIndex: column,
      render: (value: string | null) => value ?? '-',
    })) ?? []

  const sampleRows =
    preview?.sample.map((row) => ({
      key: row.row,
      ...row.data,
    })) ?? []

  const batchColumns = [
    { title: 'Dosya', dataIndex: 'filename' },
    { title: 'Toplam', dataIndex: 'total_rows', width: 80 },
    { title: 'Başarılı', dataIndex: 'success_rows', width: 90 },
    { title: 'Hatalı', dataIndex: 'failed_rows', width: 80 },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 110,
      render: (value: string) => <Tag color={statusColor[value] ?? 'default'}>{value}</Tag>,
    },
    {
      title: 'Tarih',
      dataIndex: 'created_at',
      width: 150,
      render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
  ]

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Mevcut CRM Veri Aktarımı
            </Typography.Title>
            <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
              CSV Şablonu İndir
            </Button>
          </Space>

          <Upload.Dragger
            accept=".csv,text/csv"
            fileList={fileListRef.current}
            beforeUpload={handleSelect}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">CSV dosyanızı buraya bırakın veya tıklayın</p>
            <p className="ant-upload-hint">
              UTF-8 kodlu, ilk satırı başlık olmalıdır. Zorunlu sütun: company_name
            </p>
          </Upload.Dragger>

          {preview && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {preview.header_valid ? (
                <Alert
                  type="success"
                  showIcon
                  message={`Dosya geçerli: ${preview.total_rows} satır bulundu`}
                  description={`Sütunlar: ${preview.columns.join(', ')}`}
                />
              ) : (
                <Alert
                  type="error"
                  showIcon
                  message="Eksik zorunlu sütunlar"
                  description={preview.missing_required.join(', ')}
                />
              )}

              {sampleRows.length > 0 && (
                <Table
                  size="small"
                  columns={sampleColumns}
                  dataSource={sampleRows}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                />
              )}

              <Button
                type="primary"
                icon={<UploadOutlined />}
                disabled={!preview.header_valid}
                loading={runMutation.isPending}
                onClick={handleRun}
              >
                Import Et
              </Button>
            </Space>
          )}

          {result && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type={result.failed_rows === 0 ? 'success' : 'warning'}
                showIcon
                message={`Import: ${result.success_rows} başarılı, ${result.failed_rows} hatalı`}
              />
              {result.error_report && (
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {result.error_report}
                </Typography.Paragraph>
              )}
            </Space>
          )}
        </Space>
      </Card>

      <Card title="Import Geçmişi" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          size="small"
          columns={batchColumns}
          dataSource={batches.data ?? []}
          loading={batches.isLoading}
          pagination={false}
        />
      </Card>
    </div>
  )
}
