import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as AntdApp, Button, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AuditOutlined, PlusOutlined } from '@ant-design/icons';
import type { Customer, CustomerType } from '../types';
import { fmt } from '../utils/format';
import { hasOpenedAccountOf } from '../utils/status';
import StatusTag from '../components/StatusTag';
import ApplicationForm from '../components/ApplicationForm';
import { dateRangeFilter, inRange, matchText, selectFilter, textFilter, useFilters } from '../components/TableFilters';
import { useStore, useCurrentUser } from '../store/useStore';

const TYPES: CustomerType[] = ['企业', '个体工商户', '个人'];
const STATUSES = ['潜在', '正式', '休眠'];

function CustomerForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const addCustomer = useStore((s) => s.addCustomer);
  const users = useStore((s) => s.users);
  const currentUser = useCurrentUser();
  const managers = users.filter((u) => u.role === 'manager');

  const onOk = async () => {
    try {
      const v = await form.validateFields();
      addCustomer({
        name: v.name,
        type: v.type ?? '企业',
        contactName: v.contactName,
        contactPhone: v.contactPhone,
        managerId: v.managerId ?? (currentUser.role === 'manager' ? currentUser.id : managers[0]?.id),
        status: '潜在',
      });
      message.success('自拓客户已新增');
      onClose();
    } catch {
      // 校验失败
    }
  };

  return (
    <Modal title="新增自拓客户" open={open} onCancel={onClose} onOk={onOk} okText="保存" destroyOnClose width={560}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: '企业',
          managerId: currentUser.role === 'manager' ? currentUser.id : managers[0]?.id,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请填写客户名称' }]}>
              <Input placeholder="公司 / 客户名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="客户类型" rules={[{ required: true, message: '请选择客户类型' }]}>
              <Select options={TYPES.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contactName" label="联系人" rules={[{ required: true, message: '请填写联系人' }]}>
              <Input placeholder="联系人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { required: true, message: '请填写联系电话' },
                { pattern: /^1\d{10}$/, message: '请输入正确的 11 位手机号' },
              ]}
            >
              <Input placeholder="11 位手机号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="managerId" label="客户经理" rules={[{ required: true, message: '请选择客户经理' }]}>
              <Select options={managers.map((u) => ({ value: u.id, label: `${u.name}（客户经理）` }))} />
            </Form.Item>
          </Col>
        </Row>
        <div className="muted" style={{ fontSize: 12 }}>
          客户编号由系统自动生成；客户状态默认「潜在」。
        </div>
      </Form>
    </Modal>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const customers = useStore((s) => s.customers);
  const applications = useStore((s) => s.applications);
  const users = useStore((s) => s.users);
  const currentUser = useCurrentUser();

  const managers = users.filter((u) => u.role === 'manager');
  const { filters, set } = useFilters();

  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);
  const [appCustomer, setAppCustomer] = useState<Customer | null>(null);

  const managerName = (id: string) => users.find((u) => u.id === id)?.name ?? '-';

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (!matchText(c.id, filters.id)) return false;
      if (!matchText(c.name, filters.name)) return false;
      if (!matchText(c.contactName, filters.contactName)) return false;
      if (!matchText(c.contactPhone, filters.contactPhone)) return false;
      if (filters.type && c.type !== filters.type) return false;
      if (filters.managerId && c.managerId !== filters.managerId) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.opened) {
        const opened = hasOpenedAccountOf(applications, c.id);
        if (filters.opened === 'opened' && !opened) return false;
        if (filters.opened === 'unopened' && opened) return false;
      }
      if (!inRange(c.updatedAt, filters.updatedAt)) return false;
      return true;
    });
  }, [customers, applications, filters]);

  const hasFilter = Object.values(filters).some((v) => !!v);

  const columns: ColumnsType<Customer> = [
    { title: '客户编号', dataIndex: 'id', width: 110, ...textFilter(filters.id, set('id'), '搜索编号') },
    {
      title: '客户名称',
      dataIndex: 'name',
      ...textFilter(filters.name, set('name'), '搜索名称'),
      render: (v: string, r) => <a onClick={() => navigate(`/customers/${r.id}`)}>{v}</a>,
    },
    {
      title: '客户类型',
      dataIndex: 'type',
      width: 120,
      ...selectFilter(filters.type, set('type'), TYPES.map((v) => ({ value: v, label: v })), '筛选类型'),
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '联系人', dataIndex: 'contactName', width: 100, ...textFilter(filters.contactName, set('contactName'), '搜索联系人') },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130, ...textFilter(filters.contactPhone, set('contactPhone'), '搜索电话') },
    {
      title: '客户经理',
      dataIndex: 'managerId',
      width: 110,
      ...selectFilter(filters.managerId, set('managerId'), managers.map((u) => ({ value: u.id, label: u.name })), '筛选经理'),
      render: (v: string) => managerName(v),
    },
    {
      title: '客户状态',
      dataIndex: 'status',
      width: 100,
      ...selectFilter(filters.status, set('status'), STATUSES.map((v) => ({ value: v, label: v })), '筛选状态'),
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '开户情况',
      key: 'opened',
      width: 110,
      ...selectFilter(
        filters.opened,
        set('opened'),
        [
          { value: 'opened', label: '已开户' },
          { value: 'unopened', label: '未开户' },
        ],
        '筛选开户情况'
      ),
      render: (_, r) =>
        hasOpenedAccountOf(applications, r.id) ? (
          <Tag color="success">已开户</Tag>
        ) : (
          <Tag>未开户</Tag>
        ),
    },
    {
      title: '最近更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      ...dateRangeFilter(filters.updatedAt, set('updatedAt')),
      render: (v: string) => fmt(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => navigate(`/customers/${r.id}`)}>
            详情
          </Button>
          {currentUser.role === 'manager' ? (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setAppCustomer(r);
                setAppOpen(true);
              }}
            >
              创建开户申请
            </Button>
          ) : (
            <Tooltip title="合规审核人员 / 客户主管请前往工作台处理">
              <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => navigate('/workbench')}>
                进入工作台
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="toolbar">
        <span className="muted">点击各列表头筛选图标进行单列筛选</span>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCustomerFormOpen(true)}>
          新增自拓客户
        </Button>
      </div>

      <div className="table-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: hasFilter ? '无符合筛选条件的结果' : '暂无客户数据' }}
        />
      </div>

      <CustomerForm open={customerFormOpen} onClose={() => setCustomerFormOpen(false)} />

      <ApplicationForm
        open={appOpen}
        prefill={
          appCustomer
            ? {
                customerId: appCustomer.id,
                customerName: appCustomer.name,
                contactName: appCustomer.contactName,
                contactPhone: appCustomer.contactPhone,
              }
            : undefined
        }
        onClose={() => {
          setAppOpen(false);
          setAppCustomer(null);
        }}
      />
    </div>
  );
}
