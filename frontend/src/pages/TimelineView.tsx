import React, { useEffect, useState } from 'react';
import { DatePicker, Spin, Tag, Tooltip, message, Modal } from 'antd';
import { LeftOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons';
import { getRooms, getBookings } from '../api';
import { format, addDays, subDays } from 'date-fns';
import BookingModal from '../components/BookingModal';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 09 to 18 (representing 09:00-10:00 to 18:00-19:00)

const TimelineView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [roomsData, bookingsData] = await Promise.all([
        getRooms(),
        getBookings(dateStr)
      ]);
      setRooms(roomsData);
      setBookings(bookingsData);
    } catch (error) {
      message.error('資料載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleCellClick = (room: any, hour: number) => {
    // Check if occupied
    const isOccupied = bookings.some(b => b.room_id === room.id && hour >= b.start_hour && hour < b.end_hour);
    if (isOccupied) return;

    setSelectedRoom(room);
    setSelectedHour(hour);
    setModalVisible(true);
  };

  const handleOccupiedCellClick = (booking: any) => {
    Modal.confirm({
      title: '快速詢問',
      content: `確定要發送通知給預訂者「${booking.booker_name}」，詢問是否還在使用該會議室嗎？`,
      okText: '發送詢問',
      cancelText: '取消',
      okButtonProps: { style: { backgroundColor: '#007A5E' } },
      onOk() {
        message.success(`已成功發送推播/信件詢問通知給 ${booking.booker_name}！`);
      },
    });
  };

  const renderCell = (room: any, hour: number) => {
    const booking = bookings.find(b => b.room_id === room.id && hour >= b.start_hour && hour < b.end_hour);
    const isStart = booking && booking.start_hour === hour;
    
    if (booking) {
      if (!isStart) return null; // handled by colspan equivalent conceptually, but here we just render wide cells
      const duration = booking.end_hour - booking.start_hour;
      const isGhost = booking.start_hour < new Date().getHours() && !booking.checked_in && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

      return (
        <div 
          key={`${room.id}-${hour}`} 
          onClick={() => handleOccupiedCellClick(booking)}
          style={{ 
            flex: duration, 
            backgroundColor: isGhost ? '#ffccc7' : '#007A5E',
            color: isGhost ? '#cf1322' : 'white',
            margin: '2px',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          <Tooltip title={`${booking.title} (${booking.booker_name})`}>
            {booking.title} {isGhost && <WarningOutlined />}
          </Tooltip>
        </div>
      );
    }

    return (
      <div 
        key={`${room.id}-${hour}`} 
        style={{ 
          flex: 1, 
          backgroundColor: '#F3F4F6', 
          margin: '2px', 
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
        onClick={() => handleCellClick(room, hour)}
      />
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1A1A1A' }}>會議室時段總覽</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Tag color="default">空閒</Tag>
          <Tag color="#007A5E">已預訂</Tag>
          <Tag color="#ffccc7" style={{ color: '#cf1322' }}>幽靈預訂</Tag>
          
          <LeftOutlined onClick={() => setSelectedDate(subDays(selectedDate, 1))} style={{ cursor: 'pointer', fontSize: 16 }} />
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{format(selectedDate, 'yyyy-MM-dd')}</div>
          <RightOutlined onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={{ cursor: 'pointer', fontSize: 16 }} />
        </div>
      </div>

      {loading ? <Spin size="large" style={{ display: 'block', margin: '40px auto' }} /> : (
        <div style={{ overflowX: 'auto', minWidth: '800px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '8px' }}>
            <div style={{ width: '150px', flexShrink: 0, fontWeight: 'bold', color: '#6B7280' }}>會議室</div>
            <div style={{ display: 'flex', flex: 1 }}>
              {HOURS.map(h => (
                <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
                  {`${h.toString().padStart(2, '0')}:00`}-{`${(h+1).toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
          </div>

          {rooms.map(room => (
            <div key={room.id} style={{ display: 'flex', marginBottom: '8px', minHeight: '40px' }}>
              <div style={{ width: '150px', flexShrink: 0, paddingRight: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#1A1A1A' }}>{room.name}</div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>{room.floor} | {room.capacity}人</div>
              </div>
              <div style={{ display: 'flex', flex: 1 }}>
                {HOURS.map(h => {
                  const booking = bookings.find(b => b.room_id === room.id && h >= b.start_hour && h < b.end_hour);
                  if (booking && booking.start_hour !== h) return null; // Skip if it's not the start hour (cell merged)
                  return renderCell(room, h);
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchData();
        }}
        selectedRoom={selectedRoom}
        selectedHour={selectedHour}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default TimelineView;
