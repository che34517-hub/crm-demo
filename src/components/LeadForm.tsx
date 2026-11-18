import { App as AntdApp, Col, Form, Input, Modal, Row, Select } from 'antd';
import type { Lead } from '../types';
import { useStore } from '../store/useStore';

const SOURCES = ['网络推广', '电话咨询', '客户转介绍', '线下活动', '其他'];
const INTENTIONS = ['高', '中', '低'];

interface Props {
  open: boolean;
  initial: Lead | null;
  onClose: () => void;
}

/** 线索新增 / 编辑的统一表单（列表页与详情页共用同一数据源） */
export default function LeadForm({ open, initial, onClose }: Props) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const addLead = useStore((s) => s.addLead);
  const updateLead = useStore((s) => s.updateLead);

  const onOk = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        name: v.name,
        contactName: v.contactName,
        contactPhone: v.contactPhone,
        source: v.source,
        intention: v.intention ?? '中',
      };
      if (initial) {
        updateLead(initial.id, payload);
        message.success('线索已更新');
      } else {
        addLead(payload);
        message.success('线索已新增（状态：待分配）');
      }
      onClose();
    } catch {
      // 校验失败
    }
  };

  return (
    <Modal
      title={initial ? `编辑线索 · ${initial.id}` : '新增线索'}
      open={open}
      onCancel={onClose}
      onOk={onOk}
      okText="保存"
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" initialValues={initial ?? { source: '网络推广', intention: '中' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="线索名称" rules={[{ required: true, message: '请填写线索名称' }]}>
              <Input placeholder="公司 / 客户名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="source" label="来源" rules={[{ required: true, message: '请选择来源' }]}>
              <Select options={SOURCES.map((v) => ({ value: v, label: v }))} />
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
            <Form.Item name="intention" label="客户意向">
              <Select options={INTENTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          {initial ? (
            <Col span={12}>
              <Form.Item label="线索编号">
                <Input value={initial.id} disabled />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        <div className="muted" style={{ fontSize: 12 }}>
          线索编号由系统自动生成；负责人与状态由分配流程自动维护，无需手动填写。
        </div>
      </Form>
    </Modal>
  );
}
