import React, { useState, useEffect } from 'react';
import { Table, Button, message, Popconfirm, Tag, Card, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';

const { Title } = Typography;

interface Booking {
  id: number;
  room_id: number;
  title: string;
  booker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  checked_in: boolean;
  room_name?: string; // We'll map this from rooms
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings') // Get all for today or generally. Let's get today.
      ]);
      
      const roomsMap = new Map(roomsRes.data.map((r: any) => [r.id, r.name]));
      
      const enrichedBookings = bookingsRes.data.map((b: any) => ({
        ...b,
        room_name: roomsMap.get(b.room_id) || '未知會議室'
      }));
      
      // Sort by date and start_time desc
      enrichedBookings.sort((a: any, b: any) => {
        const timeA = dayjs(\`\${a.date} \${a.start_time}\`);
        const timeB = dayjs(\`\${b.date} \${b.start_time}\`);
        return timeB.valueOf() - timeA.valueOf(); // Newest first
      });

      setBookings(enrichedBookings);
    } catch (error) {
      message.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (id: number) => {
    try {
      await api.put(\`/bookings/\${id}\`, { action: 'check_in' });
      message.success('報到成功');
      fetchData();
    } catch (error) {
      message.error('報到失敗');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.delete(\`/bookings/\${id}\`);
      message.success('已取消預約');
      fetchData();
    } catch (error) {
      message.error('取消預約失敗');
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '時間',
      key: 'time',
      render: (_: any, record: Booking) => \`\${record.start_time} - \${record.end_time}\`,
    },
    {
      title: '會議室',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: '會議主題',
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
      render: (_: any, record: Booking) => {
        const currentTime = dayjs();
        const startDateTime = dayjs(\`\${record.date} \${record.start_time}\`);
        const endDateTime = dayjs(\`\${record.date} \${record.end_time}\`);
        
        if (record.checked_in) {
          return <Tag color="success">已報到</Tag>;
        }
        
        if (currentTime.isAfter(endDateTime)) {
          return <Tag color="default">已結束 (未報到)</Tag>;
        }
        
        if (currentTime.isAfter(startDateTime.add(15, 'minute'))) {
          return <Tag color="warning">幽靈預訂 (請盡速報到)</Tag>;
        }
        
        return <Tag color="processing">未報到</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Booking) => {
        const currentTime = dayjs();
        const endDateTime = dayjs(\`\${record.date} \${record.end_time}\`);
        const isPast = currentTime.isAfter(endDateTime);

        if (isPast) return null;

        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!record.checked_in && (
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleCheckIn(record.id)}
              >
                報到
              </Button>
            )}
            <Popconfirm
              title="確定要取消此預約嗎？"
              onConfirm={() => handleCancel(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button danger size="small" icon={<CloseCircleOutlined />}>
                取消
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <Card title="今日/所有預訂清單" bordered={false}>
      <Table 
        columns={columns} 
        dataSource={bookings} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default MyBookings;
