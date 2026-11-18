import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { App as AntdApp, Button, Col, Row, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SendOutlined, UndoOutlined } from '@ant-design/icons';
import type { Lead } from '../types';
import { fmt } from '../utils/format';
import StatCard from '../components/StatCard';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import { useStore } from '../store/useStore';

const SOURCES = ['网络推广', '电话咨询', '客户转介绍', '线下活动', '其他'];
const INTENTIONS = ['高', '中', '低'];

export default function Assign() {
  const leads = useStore((s) => s.leads);
  const users = useStore((s) => s.users);
  const assignLeads = useStore((s) => s.assignLeads);
  const { message, modal } = AntdApp.useApp();

  const managers = users.filter((u) => u.role === 'manager');
  const pending = useMemo(() => leads.filter((l) => l.status === '待分配'), [leads]);
  const assignedTotal = useMemo(() => leads.filter((l) => l.assignedAt).length, [leads]);

  const { filters, set } = useFilters();
  const [selected, setSelected] = useState<Key[]>([]);
  const [managerId, setManagerId] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return pending.filter((l) => {
      if (!matchText(l.id, filters.id)) return false;
      if (!matchText(l.name, filters.name)) return false;
      if (!matchText(l.contactName, filters.contactName)) return false;
      if (!matchText(l.contactPhone, filters.contactPhone)) return false;
      if (filters.source && l.source !== filters.source) return false;
      if (filters.intention && l.intention !== filters.intention) return false;
      if (!inRange(l.createdAt, filters.createdAt)) return false;
      return true;
    });
  }, [pending, filters]);

  const hasFilter = Object.values(filters).some((v) => !!v);

  const confirmAssign = () => {
    if (!selected.length) {
      message.warning('请先选择要分配的线索');
      return;
    }
    if (!managerId) {
      message.warning('请选择目标客户经理');
      return;
    }
    const target = managers.find((m) => m.id === managerId)?.name;
    modal.confirm({
      title: '确认分配线索',
      content: `将 ${selected.length} 条线索分配给客户经理「${target}」，分配后线索状态变为「跟进中」。`,
      okText: '确认分配',
      cancelText: '取消',
      onOk: () => {
        assignLeads(selected.map(String), managerId);
        message.success(`已分配 ${selected.length} 条线索给 ${target}`);
        setSelected([]);
        setManagerId(undefined);
      },
    });
  };

  const columns: ColumnsType<Lead> = [
    { title: '线索编号', dataIndex: 'id', width: 130, ...textFilter(filters.id, set('id'), '搜索编号') },
    { title: '线索名称', dataIndex: 'name', ...textFilter(filters.name, set('name'), '搜索名称') },
    { title: '联系人', dataIndex: 'contactName', width: 110, ...textFilter(filters.contactName, set('contactName'), '搜索联系人') },
    { title: '联系电话', dataIndex: 'contactPhone', width: 150, ...textFilter(filters.contactPhone, set('contactPhone'), '搜索电话') },
    {
      title: '来源',
      dataIndex: 'source',
      width: 120,
      ...selectFilter(filters.source, set('source'), SOURCES.map((v) => ({ value: v, label: v })), '筛选来源'),
    },
    {
      title: '客户意向',
      dataIndex: 'intention',
      width: 120,
      ...selectFilter(filters.intention, set('intention'), INTENTIONS.map((v) => ({ value: v, label: v })), '筛选意向'),
      render: (v: string) => <Tag color={v === '高' ? 'success' : v === '中' ? 'warning' : 'default'}>{v}</Tag>,
    },
    {
      title: '创建时间',
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
          <StatCard title="待分配线索" value={pending.length} valueStyle={{ color: '#fa8c16' }} />
        </Col>
        <Col span={6}>
          <StatCard title="本次已选择" value={selected.length} valueStyle={{ color: '#1668dc' }} />
        </Col>
        <Col span={6}>
          <StatCard title="累计已分配" value={assignedTotal} valueStyle={{ color: '#52c41a' }} />
        </Col>
        <Col span={6}>
          <StatCard title="可选客户经理" value={managers.length} />
        </Col>
      </Row>

      <div className="toolbar">
        <Select
          placeholder="选择目标客户经理"
          style={{ width: 240 }}
          value={managerId}
          onChange={setManagerId}
          options={managers.map((m) => ({ value: m.id, label: `${m.name}（客户经理）` }))}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={confirmAssign}>
          确认分配
        </Button>
        <Button icon={<UndoOutlined />} onClick={() => setSelected([])} disabled={!selected.length}>
          取消选择
        </Button>
        <Space style={{ marginLeft: 'auto' }}>
          <span className="muted">
            已勾选 <b>{selected.length}</b> 条 · 点击表头筛选图标可单列筛选
          </span>
        </Space>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <span className="section-title" style={{ margin: 0 }}>
            待分配线索列表
          </span>
          <span className="muted">
            {pending.length ? '勾选一行或多行进行分配' : '暂无待分配线索'}
          </span>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: setSelected,
          }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无待分配线索' }}
        />
      </div>
    </div>
  );
}
