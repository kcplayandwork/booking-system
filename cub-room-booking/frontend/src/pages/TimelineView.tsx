import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, Button, message, Tag } from 'antd';
import { TeamOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import api from '../api';
import BookingModal from '../components/BookingModal';

dayjs.extend(isBetween);

const { Title } = Typography;

interface Room {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  amenities: string[];
  color: string;
}

interface Booking {
  id: number;
  room_id: number;
  title: string;
  booker_name: string;
  date: string;
  start_time: string;
  end_time: string;
  checked_in: boolean;
}

const TimelineView: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // '09:00'

  const currentDate = dayjs().format('YYYY-MM-DD');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get(\`/bookings?date=\${currentDate}\`)
      ]);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      message.error('載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCellClick = (room: Room, hour: number, minute: number) => {
    const timeString = \`\${hour.toString().padStart(2, '0')}:\${minute.toString().padStart(2, '0')}\`;
    setSelectedRoom(room);
    setSelectedTime(timeString);
    setIsModalVisible(true);
  };

  const handleReleaseGhosts = async () => {
    try {
      const currentTime = dayjs().format('HH:mm');
      const res = await api.post('/bookings/release-ghosts', {
        date: currentDate,
        current_time: currentTime
      });
      message.success(res.data.message);
      fetchData();
    } catch (error) {
      message.error('釋放幽靈預訂失敗');
    }
  };

  // 統計計算
  const currentTime = dayjs();
  const totalRooms = rooms.length;
  const activeBookings = bookings.filter(b => b.checked_in || dayjs(\`\${b.date} \${b.start_time}\`).isAfter(currentTime.subtract(15, 'minute')));
  const ghostBookings = bookings.filter(b => !b.checked_in && dayjs(\`\${b.date} \${b.start_time}\`).isBefore(currentTime.subtract(15, 'minute')));
  
  // 找出目前有空閒的會議室數量
  const currentOccupiedRoomIds = new Set(
    bookings.filter(b => {
      const start = dayjs(\`\${b.date} \${b.start_time}\`);
      const end = dayjs(\`\${b.date} \${b.end_time}\`);
      return currentTime.isBetween(start, end, null, '[)');
    }).map(b => b.room_id)
  );
  const availableRoomsCount = totalRooms - currentOccupiedRoomIds.size;

  const hours = Array.from({ length: 10 }, (_, i) => i + 9); // 09:00 - 18:00 (end at 19:00)

  // 繪製 booking block
  const renderBookingBlocks = (roomId: number) => {
    const roomBookings = bookings.filter(b => b.room_id === roomId);
    return roomBookings.map(booking => {
      const startSplit = booking.start_time.split(':');
      const endSplit = booking.end_time.split(':');
      
      const startHour = parseInt(startSplit[0]);
      const startMin = parseInt(startSplit[1]);
      const endHour = parseInt(endSplit[0]);
      const endMin = parseInt(endSplit[1]);

      // 基準從 09:00 開始
      const startOffsetMinutes = (startHour - 9) * 60 + startMin;
      const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);

      const totalDayMinutes = 10 * 60; // 9:00 to 19:00 is 10 hours

      const leftPercent = (startOffsetMinutes / totalDayMinutes) * 100;
      const widthPercent = (durationMinutes / totalDayMinutes) * 100;

      const isGhost = !booking.checked_in && dayjs(\`\${booking.date} \${booking.start_time}\`).isBefore(currentTime.subtract(15, 'minute'));

      return (
        <div
          key={booking.id}
          className={\`booking-block \${isGhost ? 'ghost' : ''}\`}
          style={{
            left: \`\${leftPercent}%\`,
            width: \`\${widthPercent}%\`,
          }}
          title={\`\${booking.title} (\${booking.start_time}-\${booking.end_time})\`}
        >
          {booking.title} ({booking.booker_name})
        </div>
      );
    });
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="可用會議室"
              value={availableRoomsCount}
              suffix={\`/ \${totalRooms}\`}
              prefix={<CheckCircleOutlined style={{ color: '#007A5E' }} />}
              valueStyle={{ color: '#007A5E' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="今日總預約數"
              value={bookings.length}
              prefix={<TeamOutlined style={{ color: '#1A1A1A' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="幽靈預訂數"
              value={ghostBookings.length}
              prefix={<WarningOutlined style={{ color: '#B8962E' }} />}
              valueStyle={{ color: '#B8962E' }}
            />
          </Card>
        </Col>
        <Col span={6} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            danger 
            icon={<WarningOutlined />} 
            onClick={handleReleaseGhosts}
            disabled={ghostBookings.length === 0}
          >
            一鍵釋放幽靈預訂
          </Button>
        </Col>
      </Row>

      <Card title={\`會議室時段總覽 - \${currentDate}\`} bordered={false} bodyStyle={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '800px', padding: '16px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', paddingBottom: '8px' }}>
              <div style={{ width: '150px', flexShrink: 0, fontWeight: 'bold', padding: '0 8px' }}>
                會議室
              </div>
              <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                {hours.map(h => (
                  <div key={h} style={{ flex: 1, textAlign: 'left', borderLeft: '1px solid #e8e8e8', paddingLeft: '4px', color: '#6B7280', fontSize: '12px' }}>
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Room rows */}
            {rooms.map(room => (
              <div key={room.id} style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', height: '60px' }}>
                <div style={{ width: '150px', flexShrink: 0, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontWeight: 'bold' }}>{room.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{room.floor} | {room.capacity}人</div>
                </div>
                
                <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                  {/* Grid lines & clickable areas */}
                  {hours.map(h => (
                    <div key={h} style={{ flex: 1, borderLeft: '1px solid #e8e8e8', display: 'flex' }}>
                      {/* 4 quarters per hour for 15-minute clicks */}
                      {[0, 15, 30, 45].map(m => (
                        <div
                          key={m}
                          style={{ flex: 1, cursor: 'pointer', borderRight: m !== 45 ? '1px dashed #f0f0f0' : 'none' }}
                          className="timeline-slot"
                          onClick={() => handleCellClick(room, h, m)}
                        />
                      ))}
                    </div>
                  ))}
                  
                  {/* Bookings */}
                  {renderBookingBlocks(room.id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <BookingModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchData();
        }}
        initialRoom={selectedRoom}
        initialTime={selectedTime}
        date={currentDate}
      />
    </div>
  );
};

export default TimelineView;
