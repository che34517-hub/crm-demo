import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  AuditOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import type { Application, Customer } from '../types';
import { fmt } from '../utils/format';
import { APP_STATUS_META, complianceStatusOf } from '../utils/status';
import StatusTag from '../components/StatusTag';
import FollowUpForm from '../components/FollowUpForm';
import LeadForm from '../components/LeadForm';
import { useStore, useCurrentUser } from '../store/useStore';

export default function LeadDetail({ kind }: { kind: 'lead' | 'customer' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message, modal } = AntdApp.useApp();
  const currentUser = useCurrentUser();

  const leads = useStore((s) => s.leads);
  const customers = useStore((s) => s.customers);
  const applications = useStore((s) => s.applications);
  const followups = useStore((s) => s.followups);
  const users = useStore((s) => s.users);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const convertLead = useStore((s) => s.convertLead);

  const [followOpen, setFollowOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const lead = kind === 'lead' ? leads.find((l) => l.id === id) : undefined;
  const customer = kind === 'customer' ? customers.find((c) => c.id === id) : undefined;

  const linkedCustomer: Customer | undefined = lead?.customerId
    ? customers.find((c) => c.id === lead.customerId)
    : customer;

  const linkedApplications = useMemo(
    () => applications.filter((a) => a.customerId === linkedCustomer?.id),
    [applications, linkedCustomer?.id]
  );

  const targetFollowups = useMemo(() => {
    const list =
      kind === 'lead'
        ? followups.filter((f) => f.targetType === 'lead' && f.targetId === id)
        : followups.filter((f) => f.targetType === 'customer' && f.targetId === id);
    return [...list].sort((a, b) => (a.time < b.time ? 1 : -1));
  }, [followups, kind, id]);

  if ((kind === 'lead' && !lead) || (kind === 'customer' && !customer)) {
    return (
      <Card>
        <Alert type="warning" showIcon message="未找到对应记录，可能已被删除或尚未转化。" />
        <Button style={{ marginTop: 12 }} onClick={() => navigate(kind === 'lead' ? '/leads' : '/customers')}>
          返回列表
        </Button>
      </Card>
    );
  }

  const userName = (uid: string | null | undefined) =>
    uid ? users.find((u) => u.id === uid)?.name ?? '-' : <span className="muted">未分配</span>;

  const appColumns: ColumnsType<Application> = [
    { title: '申请编号', dataIndex: 'id', width: 120 },
    { title: '开户类型', dataIndex: 'accountType', width: 150 },
    { title: '状态', dataIndex: 'status', width: 120, render: (v: keyof typeof APP_STATUS_META) => <StatusTag status={APP_STATUS_META[v].label} /> },
    { title: '提交时间', dataIndex: 'submittedAt', width: 160, render: (v?: string) => fmt(v) },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160, render: (v: string) => fmt(v) },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => navigate('/workbench')}>
          去工作台处理
        </Button>
      ),
    },
  ];

  const basicInfo = () => {
    if (kind === 'lead' && lead) {
      return (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="线索编号">{lead.id}</Descriptions.Item>
          <Descriptions.Item label="线索状态"><StatusTag status={lead.status} /></Descriptions.Item>
          <Descriptions.Item label="线索名称" span={2}>{lead.name}</Descriptions.Item>
          <Descriptions.Item label="联系人">{lead.contactName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{lead.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="来源">{lead.source}</Descriptions.Item>
          <Descriptions.Item label="客户意向">
            <Tag color={lead.intention === '高' ? 'success' : lead.intention === '中' ? 'warning' : 'default'}>{lead.intention}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="负责人">{userName(lead.ownerId)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{fmt(lead.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="分配时间">{fmt(lead.assignedAt)}</Descriptions.Item>
          <Descriptions.Item label="分配人">{lead.assignedBy ?? '-'}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (customer) {
      return (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="客户编号">{customer.id}</Descriptions.Item>
          <Descriptions.Item label="客户状态"><StatusTag status={customer.status} /></Descriptions.Item>
          <Descriptions.Item label="客户名称" span={2}>{customer.name}</Descriptions.Item>
          <Descriptions.Item label="客户类型">{customer.type}</Descriptions.Item>
          <Descriptions.Item label="合规审核状态"><StatusTag status={complianceStatusOf(applications, customer.id)} /></Descriptions.Item>
          <Descriptions.Item label="联系人">{customer.contactName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{customer.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="客户经理">{userName(customer.managerId)}</Descriptions.Item>
          <Descriptions.Item label="最近更新">{fmt(customer.updatedAt)}</Descriptions.Item>
        </Descriptions>
      );
    }
    return null;
  };

  const businessHistory = () => {
    if (kind === 'lead' && lead) {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {lead.assignedAt ? (
            <Card size="small" title="分配记录">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="分配时间">{fmt(lead.assignedAt)}</Descriptions.Item>
                <Descriptions.Item label="分配人">{lead.assignedBy ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="目标客户经理">{userName(lead.ownerId)}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <Alert type="info" showIcon message="该线索尚未分配。" />
          )}
          {lead.status === '已转化' && linkedCustomer ? (
            <Card size="small" title={`已转化为客户 · ${linkedCustomer.name}`}>
              <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate(`/customers/${linkedCustomer.id}`)}>
                查看客户详情
              </Button>
              <Table rowKey="id" size="small" columns={appColumns} dataSource={linkedApplications} pagination={false} />
            </Card>
          ) : null}
        </Space>
      );
    }
    if (customer) {
      return (
        <div className="table-card">
          <Table
            rowKey="id"
            size="small"
            columns={appColumns}
            dataSource={linkedApplications}
            pagination={false}
            locale={{ emptyText: '该客户暂无开户申请' }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page">
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(kind === 'lead' ? '/leads' : '/customers')}>
            返回
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {kind === 'lead' ? lead!.name : customer!.name}
          </Typography.Title>
          {kind === 'lead' && lead!.status === '已转化' ? <Tag color="success">已转化</Tag> : null}
        </Space>
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => navigate('/customers')}>
            客户管理
          </Button>
          <Button icon={<AuditOutlined />} onClick={() => navigate('/workbench')}>
            开户申请与审核
          </Button>
          {kind === 'lead' && lead!.status !== '已转化' ? (
            <Button
              type="primary"
              icon={<UserSwitchOutlined />}
              onClick={() =>
                modal.confirm({
                  title: '确认将该线索转为客户？',
                  content: '转化后将生成客户档案，并可在客户详情中发起开户申请。',
                  okText: '转为客户',
                  cancelText: '取消',
                  onOk: () => {
                    const c = convertLead(lead!.id);
                    message.success('已转为客户');
                    navigate(`/customers/${c.id}`);
                  },
                })
              }
            >
              转为客户
            </Button>
          ) : null}
          {kind === 'customer' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/workbench?new=1&customerId=${customer!.id}`)}>
              创建开户申请
            </Button>
          ) : lead!.status === '已转化' && linkedCustomer ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/workbench?new=1&customerId=${linkedCustomer.id}`)}>
              创建开户申请
            </Button>
          ) : null}
        </Space>
      </Space>

      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                {basicInfo()}
                <Button style={{ marginTop: 16 }} icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                  编辑资料
                </Button>
              </Card>
            ),
          },
          {
            key: 'follow',
            label: '跟进记录',
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setFollowOpen(true)}>
                    新增跟进记录
                  </Button>
                }
              >
                {targetFollowups.length ? (
                  <Timeline
                    items={targetFollowups.map((f) => ({
                      children: (
                        <div>
                          <Space>
                            <Typography.Text strong>{f.method}</Typography.Text>
                            <Tag color={f.intention === '高' ? 'success' : f.intention === '中' ? 'warning' : 'default'}>
                              意向 {f.intention}
                            </Tag>
                            <span className="muted">{fmt(f.time)}</span>
                          </Space>
                          <div>{f.content}</div>
                          {f.nextPlan ? <div className="muted" style={{ fontSize: 12 }}>下一步：{f.nextPlan}</div> : null}
                          <div className="muted" style={{ fontSize: 12 }}>记录人：{f.createdBy}</div>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <span className="muted">暂无跟进记录</span>
                )}
              </Card>
            ),
          },
          {
            key: 'history',
            label: '业务历史',
            children: businessHistory(),
          },
        ]}
      />

      <FollowUpForm open={followOpen} onClose={() => setFollowOpen(false)} targetType={kind} targetId={id} />

      {kind === 'lead' ? (
        <LeadForm open={editOpen} initial={lead ?? null} onClose={() => setEditOpen(false)} />
      ) : (
        <CustomerEditModal
          open={editOpen}
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => { updateCustomer(id, patch); message.success('客户资料已更新'); setEditOpen(false); }}
        />
      )}
    </div>
  );
}

interface CustomerEditModalProps {
  open: boolean;
  customer?: Customer;
  onClose: () => void;
  onSave: (patch: Partial<Customer>) => void;
}

function CustomerEditModal({ open, customer, onClose, onSave }: CustomerEditModalProps) {
  const [form] = Form.useForm();
  const users = useStore((s) => s.users);
  const managers = users.filter((u) => u.role === 'manager');

  const onOk = async () => {
    const v = await form.validateFields();
    onSave({
      name: v.name,
      type: v.type,
      contactName: v.contactName,
      contactPhone: v.contactPhone,
      status: v.status,
      managerId: v.managerId,
    });
  };

  return (
    <Modal title="编辑客户资料" open={open} onCancel={onClose} onOk={onOk} okText="保存" destroyOnClose width={560}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: customer?.name,
          type: customer?.type,
          contactName: customer?.contactName,
          contactPhone: customer?.contactPhone,
          status: customer?.status,
          managerId: customer?.managerId,
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请填写名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contactName" label="联系人" rules={[{ required: true, message: '请填写联系人' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true, message: '请填写联系电话' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="客户类型">
              <Select options={['企业', '个体工商户', '个人'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="客户状态">
              <Select options={['潜在', '正式', '休眠'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="managerId" label="客户经理">
              <Select options={managers.map((u) => ({ value: u.id, label: `${u.name}（客户经理）` }))} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
