import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, message, Select, Modal } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, WarningOutlined, SyncOutlined } from '@ant-design/icons';
import { getDashboardStats, releaseGhosts, findAvailableRooms, findOccupiedBookings, currentUser, getCurrentDecimalHour } from '../api';
import { format } from 'date-fns';
import BookingModal from '../components/BookingModal';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ usageRate: 0, totalBookings: 0, ghostCount: 0, availableNowCount: 0 });
  const [loading, setLoading] = useState(false);
  const [searchCapacity, setSearchCapacity] = useState<number>(4);
  const [searchBuilding, setSearchBuilding] = useState<string>('所有大樓');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [occupiedBookings, setOccupiedBookings] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentHour = getCurrentDecimalHour();
      const data = await getDashboardStats(today, currentHour);
      setStats(data);
    } catch (error) {
      console.error('無法取得統計資料', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReleaseGhosts = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentHour = getCurrentDecimalHour();
      const res = await releaseGhosts(today, currentHour);
      message.success(res.message);
      fetchStats();
    } catch (error) {
      message.error('釋放幽靈預訂失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAvailableRooms = async () => {
    setSearchLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentHour = getCurrentDecimalHour();
      const rooms = await findAvailableRooms(today, currentHour, searchCapacity, searchBuilding);
      setAvailableRooms(rooms);
      
      if (rooms.length === 0) {
        const occupied = await findOccupiedBookings(today, currentHour, searchCapacity, searchBuilding);
        setOccupiedBookings(occupied);
      } else {
        setOccupiedBookings([]);
      }
      setHasSearched(true);
    } catch (error) {
      message.error('搜尋失敗');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNegotiate = (booking: any) => {
    Modal.confirm({
      title: '發送會議室協調請求',
      content: `確定要發送訊息給「${booking.booker_name}」，詢問是否能讓出【${booking.room_name}】給您使用嗎？`,
      okText: '發送請求',
      cancelText: '取消',
      okButtonProps: { style: { backgroundColor: '#007A5E' } },
      onOk() {
        message.success(`已發送協調請求給 ${booking.booker_name}！對方同意後將自動轉換預訂至您的名下。`);
      },
    });
  };

  const handleQuickBook = (room: any) => {
    setSelectedRoom(room);
    setBookingModalVisible(true);
  };

  const handleSimulateQRScan = () => {
    message.success('QR Code 掃描成功！已為您完成報到手續。');
    setQrModalVisible(false);
    fetchStats();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: '#1A1A1A' }}>今日統計總覽</h2>
        <Button 
          type="primary" 
          danger 
          icon={<SyncOutlined />} 
          onClick={handleReleaseGhosts}
          loading={loading}
          disabled={stats.ghostCount === 0}
        >
          一鍵釋放幽靈預訂
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: '#E6F4F0', borderColor: '#007A5E' }}>
            <Statistic
              title="今日使用率"
              value={stats.usageRate}
              suffix="%"
              valueStyle={{ color: '#007A5E', fontWeight: 'bold' }}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="已預訂時段總數"
              value={stats.totalBookings}
              valueStyle={{ color: '#1A1A1A' }}
              prefix={<CheckCircleOutlined style={{ color: '#007A5E' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: stats.ghostCount > 0 ? '#fff1f0' : '#fff' }}>
            <Statistic
              title="幽靈預訂數"
              value={stats.ghostCount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="目前可用會議室"
              value={stats.availableNowCount}
              valueStyle={{ color: '#007A5E', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="即時查找空會議室" bordered={false} style={{ height: '100%' }}>
            <div style={{ marginBottom: 16, color: '#007A5E', fontWeight: 'bold' }}>
              👤 當前預訂人：{currentUser.name} ({currentUser.empId}) / {currentUser.email}
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>大樓：</span>
                <Select
                  value={searchBuilding}
                  onChange={(value) => setSearchBuilding(value)}
                  style={{ width: 140 }}
                  options={[
                    { value: '所有大樓', label: '所有大樓' },
                    { value: '台北101大樓', label: '台北101大樓' },
                    { value: '松仁總行', label: '松仁總行' },
                    { value: '南港資訊大樓', label: '南港資訊大樓' },
                  ]}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>人數：</span>
                <input 
                  type="number" 
                  min={1} 
                  value={searchCapacity} 
                  onChange={(e) => setSearchCapacity(Number(e.target.value))}
                  style={{ width: 60, padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                />
              </div>
              <Button type="primary" style={{ backgroundColor: '#007A5E' }} onClick={handleSearchAvailableRooms} loading={searchLoading}>
                尋找
              </Button>
            </div>
            {availableRooms.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {availableRooms.map(room => (
                  <div key={room.id} style={{ padding: 12, border: '1px solid #E6F4F0', borderRadius: 8, backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#007A5E' }}>{room.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>位置：{room.building} {room.floor}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>容納人數：{room.capacity} 人</div>
                    </div>
                    <Button type="primary" size="small" style={{ marginTop: 12, backgroundColor: '#007A5E' }} onClick={() => handleQuickBook(room)}>
                      立即預訂
                    </Button>
                  </div>
                ))}
              </div>
            ) : hasSearched && occupiedBookings.length > 0 ? (
              <div>
                <div style={{ color: '#cf1322', padding: '12px 0', fontWeight: 'bold' }}>
                  <WarningOutlined /> 目前無符合條件的空會議室。以下為符合您需求但正在使用中的會議室，您可以嘗試聯絡現有借用人進行協調：
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {occupiedBookings.map(b => (
                    <div key={b.id} style={{ padding: 12, border: '1px solid #ffccc7', borderRadius: 8, backgroundColor: '#fff1f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1A1A1A' }}>{b.room_name} ({b.room_building} {b.room_floor})</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>預訂主題：{b.title}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>預訂人：{b.booker_name} (Email: {b.email || '未提供'})</div>
                      </div>
                      <Button type="primary" danger size="small" onClick={() => handleNegotiate(b)}>
                        協調讓出
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : hasSearched ? (
              <div style={{ color: '#6B7280', padding: '20px 0' }}>目前沒有符合條件的會議室（包含使用中的）。請放寬搜尋條件。</div>
            ) : (
              <div style={{ color: '#6B7280', padding: '20px 0' }}>請輸入條件並點擊尋找。</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="行動報到 (QR Code)" bordered={false} style={{ height: '100%', backgroundColor: '#E6F4F0', borderColor: '#007A5E' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 48, color: '#007A5E', marginBottom: 8 }}>📱</div>
              <h3 style={{ color: '#1A1A1A', margin: '0 0 8px 0' }}>掃描門牌立即報到</h3>
              <p style={{ color: '#6B7280', fontSize: 14, textAlign: 'left', marginBottom: 16 }}>
                1. 走到預訂的會議室門口<br/>
                2. 開啟手機相機掃描門牌上的 QR Code<br/>
                3. 系統自動確認使用中，避免被標記為幽靈預訂！
              </p>
              <Button type="primary" style={{ backgroundColor: '#1A1A1A' }} onClick={() => setQrModalVisible(true)} block>
                模擬掃描 QR Code
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 模擬 QR Code 掃描的 Modal */}
      {qrModalVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 250, height: 250, border: '2px solid #007A5E', borderRadius: 16,
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#007A5E',
              boxShadow: '0 0 10px #007A5E',
              animation: 'scan 2s infinite linear'
            }}></div>
            <style>{`
              @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
            `}</style>
          </div>
          <div style={{ color: 'white', marginTop: 24, fontSize: 18 }}>對準會議室 QR Code...</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <Button type="primary" onClick={handleSimulateQRScan} style={{ backgroundColor: '#007A5E' }}>模擬掃描成功</Button>
            <Button onClick={() => setQrModalVisible(false)}>取消</Button>
          </div>
        </div>
      )}

      <BookingModal
        visible={bookingModalVisible}
        onCancel={() => setBookingModalVisible(false)}
        onSuccess={() => {
          setBookingModalVisible(false);
          fetchStats(); // Refresh dashboard stats
          handleSearchAvailableRooms(); // Refresh search results
        }}
        selectedRoom={selectedRoom}
        selectedHour={Math.floor(getCurrentDecimalHour() * 4) / 4}
        selectedDate={new Date()}
      />
    </div>
  );
};

export default Dashboard;
