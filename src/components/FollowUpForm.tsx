import { useState } from 'react';
import { App as AntdApp, Col, DatePicker, Form, Input, Modal, Row, Select } from 'antd';
import dayjs from 'dayjs';
import type { FollowUp } from '../types';
import { FOLLOW_METHODS } from '../types';
import { useStore, useCurrentUser } from '../store/useStore';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 若从线索/客户详情进入，则锁定关联对象 */
  targetType?: FollowUp['targetType'];
  targetId?: string;
}

const INTENTIONS = ['高', '中', '低'];

export default function FollowUpForm({ open, onClose, targetType, targetId }: Props) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const addFollowUp = useStore((s) => s.addFollowUp);
  const leads = useStore((s) => s.leads);
  const customers = useStore((s) => s.customers);
  const currentUser = useCurrentUser();

  const locked = !!targetType && !!targetId;
  const [target, setTarget] = useState<{ type: FollowUp['targetType']; id: string } | null>(null);

  const lockedName = locked
    ? targetType === 'lead'
      ? leads.find((l) => l.id === targetId)?.name ?? targetId
      : customers.find((c) => c.id === targetId)?.name ?? targetId
    : '';

  const onOk = async () => {
    try {
      const v = await form.validateFields();
      const t = locked ? { type: targetType!, id: targetId! } : target;
      if (!t) {
        message.warning('请选择所属对象（关联线索 / 客户）');
        return;
      }
      addFollowUp({
        targetType: t.type,
        targetId: t.id,
        time: v.time ? v.time.format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
        method: v.method,
        content: v.content,
        intention: v.intention ?? '中',
        nextPlan: v.nextPlan ?? '',
        createdBy: currentUser.name,
      });
      message.success('跟进记录已新增');
      setTarget(null);
      onClose();
    } catch {
      // 校验失败
    }
  };

  const objectOptions = [
    {
      label: '线索',
      options: leads.map((l) => ({ value: `lead:${l.id}`, label: `线索 · ${l.name}（${l.id}）` })),
    },
    {
      label: '客户',
      options: customers.map((c) => ({ value: `customer:${c.id}`, label: `客户 · ${c.name}（${c.id}）` })),
    },
  ];

  return (
    <Modal title="新增跟进记录" open={open} onCancel={onClose} onOk={onOk} okText="保存" destroyOnClose width={560}>
      <Form form={form} layout="vertical" initialValues={{ time: dayjs(), intention: '中', method: '电话' }}>
        <Row gutter={16}>
          {locked ? (
            <Col span={24}>
              <Form.Item label="所属对象">
                <Input value={`${targetType === 'lead' ? '线索' : '客户'} · ${lockedName}（${targetId}）`} disabled />
              </Form.Item>
            </Col>
          ) : (
            <Col span={24}>
              <Form.Item
                name="target"
                label="所属对象（关联线索 / 客户）"
                rules={[{ required: true, message: '请选择所属对象' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择关联的线索或客户"
                  options={objectOptions}
                  onChange={(v: string) => {
                    const [type, id] = v.split(':');
                    setTarget({ type: type as FollowUp['targetType'], id });
                  }}
                />
              </Form.Item>
            </Col>
          )}
          <Col span={12}>
            <Form.Item name="time" label="跟进时间" rules={[{ required: true, message: '请选择跟进时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="method" label="跟进方式" rules={[{ required: true, message: '请选择跟进方式' }]}>
              <Select options={FOLLOW_METHODS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="intention" label="客户意向">
              <Select options={INTENTIONS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="content" label="沟通内容" rules={[{ required: true, message: '请填写沟通内容' }]}>
              <Input.TextArea rows={3} placeholder="本次沟通的主要内容" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="nextPlan" label="下一步计划（选填）">
              <Input.TextArea rows={2} placeholder="下一步跟进计划" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
