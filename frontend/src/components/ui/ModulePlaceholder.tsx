import { Card, Empty } from 'antd'

interface ModulePlaceholderProps {
  title: string
  description: string
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <Card title={title}>
      <Empty description={description} />
    </Card>
  )
}
