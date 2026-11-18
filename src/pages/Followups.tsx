import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Col, Row, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import type { FollowUp } from '../types';
import { FOLLOW_METHODS } from '../types';
import { fmt } from '../utils/format';
import StatCard from '../components/StatCard';
import StatusTag from '../components/StatusTag';
import FollowUpForm from '../components/FollowUpForm';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import { useStore } from '../store/useStore';

const INTENTIONS = ['高', '中', '低'];

export default function Followups() {
  const navigate = useNavigate();
  const followups = useStore((s) => s.followups);
  const leads = useStore((s) => s.leads);
  const customers = useStore((s) => s.customers);

  const { filters, set } = useFilters();
  const [formOpen, setFormOpen] = useState(false);

  const targetOf = (f: FollowUp): { name: string; path: string } => {
    if (f.targetType === 'lead') {
      const lead = leads.find((l) => l.id === f.targetId);
      return { name: lead?.name ?? f.targetId, path: `/leads/${f.targetId}` };
    }
    const customer = customers.find((c) => c.id === f.targetId);
    return { name: customer?.name ?? f.targetId, path: `/customers/${f.targetId}` };
  };

  const rows = useMemo(() => {
    return followups
      .filter((f) => {
        if (!matchText(f.id, filters.id)) return false;
        if (filters.targetType && f.targetType !== filters.targetType) return false;
        if (filters.method && f.method !== filters.method) return false;
        if (filters.intention && f.intention !== filters.intention) return false;
        if (!matchText(f.content, filters.content)) return false;
        if (!matchText(f.createdBy, filters.createdBy)) return false;
        if (!inRange(f.time, filters.time)) return false;
        if (!inRange(f.createdAt, filters.createdAt)) return false;
        return true;
      })
      .sort((a, b) => (a.time < b.time ? 1 : -1));
  }, [followups, filters]);

  const hasFilter = Object.values(filters).some((v) => !!v);

  const stats = useMemo(() => {
    const byType = (t: string) => followups.filter((f) => f.targetType === t).length;
    const times = followups.map((f) => f.time).sort();
    return {
      total: followups.length,
      lead: byType('lead'),
      customer: byType('customer'),
      latest: times.length ? fmt(times[times.length - 1]) : '-',
    };
  }, [followups]);

  const columns: ColumnsType<FollowUp> = [
    { title: '跟进编号', dataIndex: 'id', width: 120, ...textFilter(filters.id, set('id'), '搜索编号') },
    {
      title: '所属对象',
      key: 'target',
      width: 260,
      ...selectFilter(
        filters.targetType,
        set('targetType'),
        [
          { value: 'lead', label: '线索' },
          { value: 'customer', label: '客户' },
        ],
        '筛选对象类型'
      ),
      render: (_, r) => {
        const t = targetOf(r);
        return (
          <Space size={6}>
            <Tag color={r.targetType === 'lead' ? 'blue' : 'purple'}>{r.targetType === 'lead' ? '线索' : '客户'}</Tag>
            <a onClick={() => navigate(t.path)}>{t.name}</a>
          </Space>
        );
      },
    },
    {
      title: '跟进时间',
      dataIndex: 'time',
      width: 170,
      ...dateRangeFilter(filters.time, set('time')),
      render: (v: string) => fmt(v),
    },
    {
      title: '跟进方式',
      dataIndex: 'method',
      width: 120,
      ...selectFilter(filters.method, set('method'), FOLLOW_METHODS.map((v) => ({ value: v, label: v })), '筛选方式'),
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '客户意向',
      dataIndex: 'intention',
      width: 120,
      ...selectFilter(filters.intention, set('intention'), INTENTIONS.map((v) => ({ value: v, label: v })), '筛选意向'),
      render: (v: string) => <StatusTag status={v} />,
    },
    { title: '跟进内容', dataIndex: 'content', ellipsis: true, ...textFilter(filters.content, set('content'), '搜索内容') },
    { title: '下一步计划', dataIndex: 'nextPlan', width: 200, ellipsis: true },
    { title: '跟进人', dataIndex: 'createdBy', width: 110, ...textFilter(filters.createdBy, set('createdBy'), '搜索跟进人') },
    {
      title: '记录时间',
      dataIndex: 'createdAt',
      width: 170,
      ...dateRangeFilter(filters.createdAt, set('createdAt')),
      render: (v: string) => fmt(v),
    },
  ];

  return (
    <div className="page">
      <Row gutter={16}>
        <Col span={6}>
          <StatCard title="跟进记录总数" value={stats.total} />
        </Col>
        <Col span={6}>
          <StatCard title="线索跟进" value={stats.lead} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={6}>
          <StatCard title="客户跟进" value={stats.customer} valueStyle={{ color: '#722ed1' }} />
        </Col>
        <Col span={6}>
          <StatCard title="最近跟进时间" value={stats.latest} />
        </Col>
      </Row>

      <div className="toolbar">
        <span className="muted">点击各列表头筛选图标进行单列筛选（按跟进时间倒序）</span>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
          添加跟进记录
        </Button>
      </div>

      <div className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无跟进记录' }}
        />
      </div>

      <FollowUpForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
