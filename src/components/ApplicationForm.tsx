import { useEffect, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Tag,
} from 'antd';
import { PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import type { Application, CustomerType, Material } from '../types';
import { ACCOUNT_TYPES, CURRENCIES, ID_TYPES } from '../types';
import { defaultMaterials } from '../data/seed';
import { useStore } from '../store/useStore';

interface Props {
  open: boolean;
  initial?: Application | null;
  prefill?: Partial<{
    customerId: string;
    customerName: string;
    contactName: string;
    contactPhone: string;
  }>;
  onClose: () => void;
}

const DEFAULT = {
  customerId: undefined as string | undefined,
  customerName: '',
  customerType: '企业' as CustomerType,
  legalName: '',
  creditCode: '',
  legalPerson: '',
  registerAddress: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  idType: '营业执照',
  idNumber: '',
  accountType: undefined as string | undefined,
  bankBranch: '',
  currency: '人民币',
  remark: '',
  amount: undefined as number | undefined,
};

export default function ApplicationForm({ open, initial, prefill, onClose }: Props) {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials());
  const addApplication = useStore((s) => s.addApplication);
  const updateApplication = useStore((s) => s.updateApplication);
  const submitApplication = useStore((s) => s.submitApplication);
  const customers = useStore((s) => s.customers);

  const applyCustomer = (customerId: string | undefined) => {
    if (!customerId) return;
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    form.setFieldsValue({
      customerName: c.name,
      customerType: c.type,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      legalName: c.name,
    });
  };

  useEffect(() => {
    if (!open) return;
    if (initial) {
      form.setFieldsValue({ ...initial, customerId: initial.customerId ?? undefined });
      setMaterials(initial.materials.map((m) => ({ ...m })));
    } else {
      form.resetFields();
      if (prefill?.customerId) {
        const c = customers.find((x) => x.id === prefill.customerId);
        form.setFieldsValue({
          ...DEFAULT,
          customerId: prefill.customerId,
          customerName: prefill.customerName ?? c?.name,
          customerType: c?.type ?? '企业',
          contactName: prefill.contactName ?? c?.contactName,
          contactPhone: prefill.contactPhone ?? c?.contactPhone,
          legalName: c?.name ?? prefill.customerName,
        });
      } else {
        form.setFieldsValue(DEFAULT);
      }
      setMaterials(defaultMaterials());
    }
  }, [open, initial, prefill, form, customers]);

  const toggleMaterial = (id: string) =>
    setMaterials((ms) => ms.map((m) => (m.id === id ? { ...m, uploaded: !m.uploaded } : m)));

  const persist = (values: Record<string, unknown>, action: 'draft' | 'submit') => {
    const input = {
      customerId: (values.customerId as string) ?? prefill?.customerId ?? initial?.customerId ?? null,
      customerName: values.customerName as string,
      customerType: values.customerType as CustomerType,
      legalName: values.legalName as string,
      creditCode: values.creditCode as string,
      legalPerson: values.legalPerson as string,
      registerAddress: values.registerAddress as string,
      contactName: values.contactName as string,
      contactPhone: values.contactPhone as string,
      contactEmail: (values.contactEmail as string) ?? '',
      idType: values.idType as string,
      idNumber: (values.idNumber as string) ?? '',
      accountType: values.accountType as string,
      bankBranch: values.bankBranch as string,
      currency: values.currency as string,
      remark: (values.remark as string) ?? '',
      amount: (values.amount as number) ?? 0,
      materials,
    };

    if (initial) {
      updateApplication(initial.id, input);
      if (action === 'submit') submitApplication(initial.id);
    } else {
      addApplication(input, action === 'submit');
    }
    message.success(action === 'submit' ? '已提交，进入客户资料合规审核' : '草稿已保存');
    onClose();
  };

  const onSaveDraft = () => {
    const values = form.getFieldsValue(true);
    if (!values.customerName) {
      message.warning('请至少填写客户名称');
      return;
    }
    persist(values, 'draft');
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      const missing = materials.filter((m) => m.required && !m.uploaded).map((m) => m.name);
      if (missing.length) {
        message.error('缺少必要证明材料：' + missing.join('、'));
        return;
      }
      persist(values, 'submit');
    } catch {
      // 校验失败，antd 已高亮错误
    }
  };

  return (
    <Modal
      title={initial ? `编辑开户申请 · ${initial.id}` : '新建开户申请'}
      open={open}
      onCancel={onClose}
      width={860}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={onSaveDraft}>保存草稿</Button>
          <Button type="primary" onClick={onSubmit}>
            提交申请
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={DEFAULT}>
        <div className="section-title">一、客户主体信息</div>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="customerId" label="关联客户（选择后自动带出资料）">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="请选择关联客户，或留空（自拓客户需先在客户管理建立档案）"
                onChange={applyCustomer}
                options={customers.map((c) => ({ value: c.id, label: `${c.name}（${c.id}）` }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请填写客户名称' }]}>
              <Input placeholder="企业/个体工商户/个人名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customerType" label="主体类型" rules={[{ required: true, message: '请选择主体类型' }]}>
              <Select
                options={['企业', '个体工商户', '个人'].map((v) => ({ value: v, label: v }))}
                placeholder="请选择"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="legalName" label="法定名称 / 主体全称" rules={[{ required: true, message: '请填写法定名称' }]}>
              <Input placeholder="与证照一致的名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="creditCode" label="统一社会信用代码" rules={[{ required: true, message: '请填写统一社会信用代码' }]}>
              <Input placeholder="18 位统一社会信用代码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="legalPerson" label="法定代表人" rules={[{ required: true, message: '请填写法定代表人' }]}>
              <Input placeholder="法定代表人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="registerAddress" label="注册地址" rules={[{ required: true, message: '请填写注册地址' }]}>
              <Input placeholder="证照登记的注册地址" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <div className="section-title">二、联系人信息</div>
        <Row gutter={16}>
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
            <Form.Item name="contactEmail" label="联系邮箱（选填）" rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
              <Input placeholder="example@company.com" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <div className="section-title">三、证件及证明材料</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="idType" label="证件类型（选填）">
              <Select options={ID_TYPES.map((v) => ({ value: v, label: v }))} allowClear placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="idNumber" label="证件号码（选填）">
              <Input placeholder="证件号码" />
            </Form.Item>
          </Col>
        </Row>
        <div className="muted" style={{ marginBottom: 8 }}>
          证明材料：带 <Tag color="error" style={{ margin: '0 2px' }}>必填</Tag> 的材料在提交前必须上传，否则无法提交。
        </div>
        {materials.map((m) => (
          <div className="material-row" key={m.id}>
            <Space>
              <PaperClipOutlined />
              <span>
                {m.name}
                {m.required ? (
                  <Tag color="error" style={{ marginLeft: 8 }}>
                    必填
                  </Tag>
                ) : (
                  <Tag style={{ marginLeft: 8 }}>选填</Tag>
                )}
              </span>
            </Space>
            <Space>
              {m.uploaded ? (
                <Tag color="success">已上传（演示占位）</Tag>
              ) : (
                <span className="muted">未上传</span>
              )}
              <Button
                size="small"
                type={m.uploaded ? 'default' : 'primary'}
                ghost={!m.uploaded}
                icon={m.uploaded ? undefined : <UploadOutlined />}
                onClick={() => toggleMaterial(m.id)}
              >
                {m.uploaded ? '移除' : '上传附件'}
              </Button>
            </Space>
          </div>
        ))}

        <Divider />
        <div className="section-title">四、开户类型及相关申请信息</div>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="accountType" label="开户类型" rules={[{ required: true, message: '请选择开户类型' }]}>
              <Select options={ACCOUNT_TYPES.map((v) => ({ value: v, label: v }))} placeholder="请选择" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bankBranch" label="开户网点" rules={[{ required: true, message: '请填写开户网点' }]}>
              <Input placeholder="例如：杭州分行营业部" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="开户金额 / 业绩额（万元）"
              rules={[{ required: true, message: '请填写开户金额' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：100" addonAfter="万元" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="currency" label="币种">
              <Select options={CURRENCIES.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="remark" label="备注（选填）">
              <Input.TextArea rows={2} placeholder="补充说明" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
