import type { ReactNode } from 'react';
import { Alert, Descriptions, Drawer, Space, Tag, Timeline, Typography } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import type { Application } from '../types';
import { fmt } from '../utils/format';
import { APP_STATUS_META } from '../utils/status';
import StatusTag from './StatusTag';
import { useStore } from '../store/useStore';

interface Props {
  open: boolean;
  application: Application | null;
  onClose: () => void;
  footer?: ReactNode;
}

function nameOf(users: { id: string; name: string }[], id: string): string {
  return users.find((u) => u.id === id)?.name ?? id;
}

export default function ApplicationDetail({ open, application, onClose, footer }: Props) {
  const users = useStore((s) => s.users);
  const app = application;
  const history = app ? [...app.history].reverse() : [];

  return (
    <Drawer
      title={app ? `开户申请详情 · ${app.id}` : '开户申请详情'}
      open={open}
      onClose={onClose}
      width={720}
      footer={footer}
    >
      {app ? (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Space>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {app.customerName}
              </Typography.Title>
              <StatusTag status={APP_STATUS_META[app.status].label} />
            </Space>
          </div>

          <div>
            <div className="section-title">客户主体信息</div>
            <Descriptions column={2} size="small" bordered className="drawer-desc">
              <Descriptions.Item label="客户名称" span={2}>
                {app.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="主体类型">{app.customerType}</Descriptions.Item>
              <Descriptions.Item label="法定名称">{app.legalName}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">{app.creditCode}</Descriptions.Item>
              <Descriptions.Item label="法定代表人">{app.legalPerson}</Descriptions.Item>
              <Descriptions.Item label="注册地址" span={2}>
                {app.registerAddress}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div>
            <div className="section-title">联系人及申请信息</div>
            <Descriptions column={2} size="small" bordered className="drawer-desc">
              <Descriptions.Item label="联系人">{app.contactName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{app.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="联系邮箱" span={2}>
                {app.contactEmail || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开户类型">{app.accountType}</Descriptions.Item>
              <Descriptions.Item label="开户金额 / 业绩额">{app.amount ?? 0} 万元</Descriptions.Item>
              <Descriptions.Item label="币种">{app.currency}</Descriptions.Item>
              <Descriptions.Item label="开户网点" span={2}>
                {app.bankBranch}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {nameOf(users, app.createdBy)}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">{fmt(app.submittedAt)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {app.remark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          <div>
            <div className="section-title">证明材料</div>
            {app.materials.map((m) => (
              <div className="material-row" key={m.id}>
                <Space>
                  <PaperClipOutlined />
                  <span>{m.name}</span>
                  <Tag color={m.required ? 'error' : 'default'}>{m.required ? '必填' : '选填'}</Tag>
                </Space>
                {m.uploaded ? (
                  <Tag color="success">附件占位：{m.name}.pdf（演示）</Tag>
                ) : (
                  <Tag>未上传</Tag>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="section-title">合规审核结论</div>
            {app.compliance ? (
              <Alert
                type={app.compliance.result === 'passed' ? 'success' : 'error'}
                showIcon
                message={
                  app.compliance.result === 'passed'
                    ? '合规审核通过'
                    : '合规审核驳回（需补充资料）'
                }
                description={
                  <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                    <Descriptions.Item label="审核人">{app.compliance.reviewer}</Descriptions.Item>
                    <Descriptions.Item label="审核时间">{fmt(app.compliance.time)}</Descriptions.Item>
                    <Descriptions.Item label="审核意见">{app.compliance.opinion}</Descriptions.Item>
                  </Descriptions>
                }
              />
            ) : (
              <span className="muted">尚未进行合规审核</span>
            )}
          </div>

          <div>
            <div className="section-title">审批结论</div>
            {app.approval ? (
              <Alert
                type={app.approval.result === 'passed' ? 'success' : 'error'}
                showIcon
                message={app.approval.result === 'passed' ? '审批通过' : '审批驳回'}
                description={
                  <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                    <Descriptions.Item label="审批人">{app.approval.reviewer}</Descriptions.Item>
                    <Descriptions.Item label="审批时间">{fmt(app.approval.time)}</Descriptions.Item>
                    <Descriptions.Item label="审批意见">{app.approval.opinion}</Descriptions.Item>
                  </Descriptions>
                }
              />
            ) : (
              <span className="muted">尚未审批</span>
            )}
          </div>

          <div>
            <div className="section-title">历史处理记录</div>
            <Timeline
              items={history.map((h) => ({
                color: h.action.includes('驳回') ? 'red' : 'blue',
                children: (
                  <div>
                    <Space>
                      <Typography.Text strong>{h.action}</Typography.Text>
                      <span className="muted">{fmt(h.time)}</span>
                    </Space>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {h.actor} · {h.detail}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </Space>
      ) : null}
    </Drawer>
  );
}
