import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, Select, Tag, Button, Popconfirm, Space, Tooltip } from 'antd';
import {
  AimOutlined,
  SendOutlined,
  TeamOutlined,
  CommentOutlined,
  AuditOutlined,
  DashboardOutlined,
  FundOutlined,
  ReloadOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useStore, useCurrentUser } from '../store/useStore';
import { ROLE_LABEL, ROLE_COLOR } from '../utils/role';

const { Sider, Header, Content } = Layout;

const MENU = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '概览 / 数据看板' },
  { key: '/leads', icon: <AimOutlined />, label: '线索管理' },
  { key: '/assign', icon: <SendOutlined />, label: '线索分配' },
  { key: '/followups', icon: <CommentOutlined />, label: '跟进管理' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
  { key: '/workbench', icon: <AuditOutlined />, label: '开户全流程管理' },
  { key: '/performance', icon: <FundOutlined />, label: '业绩分配与薪酬' },
];

const TITLES: Record<string, string> = {
  '/dashboard': '概览 / 数据看板',
  '/leads': '线索管理',
  '/assign': '线索分配',
  '/followups': '跟进管理',
  '/customers': '客户管理',
  '/workbench': '开户全流程管理',
  '/performance': '业绩分配与薪酬管理',
};

function pageTitle(path: string): string {
  if (path.startsWith('/leads/')) return '线索跟进与客户详情';
  if (path.startsWith('/customers/')) return '客户详情';
  return TITLES[path] ?? '';
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const reset = useStore((s) => s.reset);

  const path = location.pathname;
  const selected = MENU.find((m) => path === m.key || path.startsWith(m.key + '/'))?.key ?? '/dashboard';
  const title = pageTitle(path);

  const options = [
    {
      label: ROLE_LABEL.manager,
      options: users.filter((u) => u.role === 'manager').map((u) => ({ value: u.id, label: u.name })),
    },
    {
      label: ROLE_LABEL.reviewer,
      options: users.filter((u) => u.role === 'reviewer').map((u) => ({ value: u.id, label: u.name })),
    },
    {
      label: ROLE_LABEL.supervisor,
      options: users.filter((u) => u.role === 'supervisor').map((u) => ({ value: u.id, label: u.name })),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark" className="app-sider">
        <div className="app-logo">
          <span className="logo-mark">
            <ThunderboltFilled />
          </span>
          客户管理 CRM
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={MENU}
          onClick={(e) => navigate(e.key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div className="header-left">
            <Breadcrumb
              items={[{ title: '首页' }, { title }]}
            />
          </div>
          <div className="header-right">
            <Space size={8}>
              <span className="role-note">演示角色模拟（非真实身份认证）</span>
              <Select
                value={currentUser.id}
                style={{ width: 180 }}
                options={options}
                onChange={setCurrentUser}
                optionRender={(opt) => (
                  <Space>
                    <span>{opt.label}</span>
                    <Tag color={ROLE_COLOR[users.find((u) => u.id === opt.value)?.role ?? 'manager']}>
                      {ROLE_LABEL[users.find((u) => u.id === opt.value)?.role ?? 'manager']}
                    </Tag>
                  </Space>
                )}
              />
              <Tooltip title="清空本地修改，恢复初始演示数据">
                <Popconfirm
                  title="重置演示数据？"
                  description="将清除所有本地操作记录，恢复到初始种子数据。"
                  okText="重置"
                  cancelText="取消"
                  onConfirm={() => {
                    reset();
                    window.location.reload();
                  }}
                >
                  <Button icon={<ReloadOutlined />} />
                </Popconfirm>
              </Tooltip>
            </Space>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
