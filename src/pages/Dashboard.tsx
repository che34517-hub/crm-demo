import { useMemo } from 'react';
import { Card, Col, Row, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import { useStore } from '../store/useStore';
import { hasOpenedAccountOf } from '../utils/status';
import { actualAmountOf } from '../utils/perf';
import { FOLLOW_METHODS } from '../types';

const BLUE = '#2a78d6';
const ORANGE = '#eb6834';
const GOOD = '#0ca30c';
const MUTED = '#c3c2b7';
const FUNNEL_COLORS = ['#86b6ef', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab'];

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e1e0d9',
  fontSize: 12,
};

export default function Dashboard() {
  const leads = useStore((s) => s.leads);
  const customers = useStore((s) => s.customers);
  const applications = useStore((s) => s.applications);
  const followups = useStore((s) => s.followups);
  const targets = useStore((s) => s.targets);
  const users = useStore((s) => s.users);

  const memberNames = (ids: string[]) =>
    ids.map((id) => users.find((u) => u.id === id)?.name ?? id).join('、');

  const openedCount = useMemo(
    () => customers.filter((c) => hasOpenedAccountOf(applications, c.id)).length,
    [customers, applications]
  );
  const openRate = customers.length ? Math.round((openedCount / customers.length) * 100) : 0;

  const funnelData = useMemo(
    () => [
      { name: '线索总量', value: leads.length },
      { name: '已分配', value: leads.filter((l) => l.assignedAt || l.ownerId).length },
      { name: '已转化', value: leads.filter((l) => l.status === '已转化').length },
      { name: '客户', value: customers.length },
      { name: '开户申请', value: applications.length },
      { name: '已开户', value: applications.filter((a) => a.status === 'approved').length },
    ],
    [leads, customers, applications]
  );

  const methodData = useMemo(
    () => FOLLOW_METHODS.map((m) => ({ name: m, 数量: followups.filter((f) => f.method === m).length })),
    [followups]
  );

  const perfData = useMemo(
    () =>
      targets.map((t) => ({
        name: `${t.periodLabel}（${memberNames(t.memberIds)}）`,
        目标: t.targetAmount,
        实际: actualAmountOf(applications, t.memberIds),
      })),
    [targets, applications, users]
  );

  const pieData = [
    { name: '已开户', value: openedCount },
    { name: '未开户', value: customers.length - openedCount },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderFunnelLabel = (props: any) => {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    return (
      <text x={x + width + 12} y={y + height / 2 + 4} fill="#0b0b0b" fontSize={12} fontWeight={600}>
        {props.name} · {props.value}
      </text>
    );
  };

  const funnelColumns: ColumnsType<{ name: string; value: number }> = [
    { title: '阶段', dataIndex: 'name' },
    { title: '数量', dataIndex: 'value', align: 'right' },
  ];

  return (
    <div className="page">
      <Row gutter={16}>
        <Col span={6}>
          <StatCard title="线索总量" value={leads.length} />
        </Col>
        <Col span={6}>
          <StatCard title="客户总量" value={customers.length} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={6}>
          <StatCard title="开户申请" value={applications.length} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={6}>
          <StatCard title="开户完成率" value={`${openRate}%`} valueStyle={{ color: '#52c41a' }} />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card size="small" title="线索转化漏斗">
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip contentStyle={tooltipStyle} />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                  label={renderFunnelLabel}
                >
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card size="small" title="开户完成情况">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  <Cell fill={GOOD} />
                  <Cell fill={MUTED} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="跟进频次统计（按方式）">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#c3c2b7' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(11,11,11,0.04)' }} />
                <Bar dataKey="数量" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="业绩目标完成度（万元）">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#c3c2b7' }} interval={0} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(11,11,11,0.04)' }} />
                <Legend />
                <Bar dataKey="目标" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="实际" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card size="small" title="漏斗各阶段明细">
        <Table
          rowKey="name"
          size="small"
          columns={funnelColumns}
          dataSource={funnelData}
          pagination={false}
        />
      </Card>
    </div>
  );
}
