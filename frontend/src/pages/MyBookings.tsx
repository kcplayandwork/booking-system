import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, message, Popconfirm } from 'antd';
import { getBookings, checkInBooking, checkoutBooking, cancelBooking, formatTime } from '../api';
import { format } from 'date-fns';

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const currentHour = new Date().getHours();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const data = await getBookings(today);
      // For demo, we just show all bookings for today instead of filtering by a specific user
      setBookings(data);
    } catch (error) {
      message.error('無法載入預訂資料');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCheckIn = async (id: number) => {
    try {
      await checkInBooking(id);
      message.success('報到成功');
      fetchBookings();
    } catch (error) {
      message.error('報到失敗');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelBooking(id);
      message.success('預訂已取消');
      fetchBookings();
    } catch (error) {
      message.error('取消失敗');
    }
  };

  const handleCheckout = async (id: number) => {
    try {
      await checkoutBooking(id, currentHour);
      message.success('刷退成功，會議室已釋出');
      fetchBookings();
    } catch (error) {
      message.error('刷退失敗');
    }
  };

  const columns = [
    {
      title: '會議室',
      key: 'room',
      render: (text: any, record: any) => `${record.room_name} (${record.room_floor})`,
    },
    {
      title: '時間',
      key: 'time',
      render: (text: any, record: any) => (
        <div style={{ color: '#007A5E', fontWeight: 'bold' }}>
          {formatTime(record.start_hour)} - {formatTime(record.end_hour)}
        </div>
      ),
    },
    {
      title: '主題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '預訂者',
      dataIndex: 'booker_name',
      key: 'booker_name',
    },
    {
      title: '狀態',
      key: 'status',
      render: (text: any, record: any) => {
        if (record.checked_out) {
          return <Tag color="default">已結束/已刷退</Tag>;
        }
        if (record.checked_in) {
          return <Tag color="success">使用中 (已報到)</Tag>;
        }
        if (record.start_hour < currentHour && !record.checked_in) {
          return <Tag color="error">未報到 (幽靈預訂)</Tag>;
        }
        return <Tag color="processing">待報到</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: any) => (
        <Space size="middle">
          {!record.checked_in && !record.checked_out && (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => handleCheckIn(record.id)}
              style={{ backgroundColor: '#007A5E', borderColor: '#007A5E' }}
            >
              報到
            </Button>
          )}
          {record.checked_in && !record.checked_out && (
            <Button 
              type="primary" 
              size="small" 
              danger
              onClick={() => handleCheckout(record.id)}
            >
              提前刷退
            </Button>
          )}
          {!record.checked_in && !record.checked_out && (
            <Popconfirm
              title="確定要取消這個預訂嗎？"
              onConfirm={() => handleCancel(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button danger size="small">取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: '#1A1A1A' }}>今日預訂清單</h2>
      <Table 
        columns={columns} 
        dataSource={bookings} 
        rowKey="id" 
        loading={loading}
        pagination={false}
      />
    </div>
  );
};

export default MyBookings;
