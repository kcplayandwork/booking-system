import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { AppstoreOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import TimelineView from './pages/TimelineView';
import MyBookings from './pages/MyBookings';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '48px' }}>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            國泰世華 會議室預訂系統
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          items={[
            {
              key: '/',
              icon: <CalendarOutlined />,
              label: <Link to="/">會議室總覽</Link>,
            },
            {
              key: '/my-bookings',
              icon: <UnorderedListOutlined />,
              label: <Link to="/my-bookings">我的預訂</Link>,
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px 48px', minHeight: 280 }}>
        {children}
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<TimelineView />} />
          <Route path="/my-bookings" element={<MyBookings />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

export default App;
