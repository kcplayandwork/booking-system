import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TimelineView from './pages/TimelineView';
import MyBookings from './pages/MyBookings';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', label: '首頁總覽' },
    { key: '/timeline', label: '會議室時段' },
    { key: '/my-bookings', label: '我的預訂' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', backgroundColor: '#007A5E', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '40px', letterSpacing: '1px' }}>
          國泰世華 會議室預訂系統
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0, backgroundColor: 'transparent' }}
        />
      </Header>
      <Content style={{ padding: '24px', backgroundColor: '#F9FAFB' }}>
        <div style={{ background: '#fff', minHeight: 280, padding: 24, borderRadius: 8 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', backgroundColor: '#F9FAFB' }}>
        Cathay United Bank ©{new Date().getFullYear()} Created by IT Dept
      </Footer>
    </Layout>
  );
};

export default App;
