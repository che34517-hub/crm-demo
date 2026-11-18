import type { ReactNode } from 'react';
import { Card, Statistic } from 'antd';

interface Props {
  title: string;
  value: number | string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  hint?: string;
  valueStyle?: React.CSSProperties;
}

export default function StatCard({ title, value, prefix, suffix, hint, valueStyle }: Props) {
  return (
    <Card size="small" bordered={false} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <Statistic title={title} value={value} prefix={prefix} suffix={suffix} valueStyle={valueStyle} />
      {hint ? <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{hint}</div> : null}
    </Card>
  );
}
