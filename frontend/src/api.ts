import axios from 'axios';

// Mock data for testing without backend
export const currentUser = {
  name: '王小明',
  empId: '12345',
  email: 'xiaoming@cathaybk.com.tw'
};

const mockRooms = [
  { id: 1, name: '台北101', building: '台北101大樓', floor: '12F', capacity: 20, amenities: '投影機、視訊設備、白板', color: '#007A5E', is_active: true },
  { id: 2, name: '信義廳', building: '松仁總行', floor: '12F', capacity: 10, amenities: '電視螢幕、白板', color: '#007A5E', is_active: true },
  { id: 3, name: '大安室', building: '松仁總行', floor: '11F', capacity: 6, amenities: '電視螢幕、視訊設備', color: '#007A5E', is_active: true },
  { id: 4, name: '松山小間', building: '松仁總行', floor: '11F', capacity: 4, amenities: '白板', color: '#007A5E', is_active: true },
  { id: 5, name: '南港會議室', building: '南港資訊大樓', floor: '13F', capacity: 30, amenities: '投影機、視訊設備、白板、麥克風', color: '#007A5E', is_active: true }
];

export const formatTime = (decimalHour: number) => {
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getCurrentDecimalHour = () => {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
};

let mockBookings = [
  { id: 1, room_id: 1, title: '專案啟動會議', booker_name: '王大明', date: new Date().toISOString().split('T')[0], start_hour: 10, end_hour: 12, checked_in: false, checked_out: false, room_name: '台北101', room_floor: '12F' },
  { id: 2, room_id: 2, title: '部門週會', booker_name: '李小梅', date: new Date().toISOString().split('T')[0], start_hour: 14, end_hour: 15.5, checked_in: true, checked_out: false, room_name: '信義廳', room_floor: '12F' },
  // Ghost booking (early in the morning, not checked in)
  { id: 3, room_id: 3, title: '幽靈預訂測試', booker_name: '測試員', date: new Date().toISOString().split('T')[0], start_hour: 9.25, end_hour: 10, checked_in: false, checked_out: false, room_name: '大安室', room_floor: '11F' }
];

export const getRooms = async () => {
  return mockRooms;
};

export const getBookings = async (date: string) => {
  return mockBookings.filter(b => b.date === date);
};

export const createBooking = async (data: any) => {
  const newBooking = {
    ...data,
    id: Date.now(),
    checked_in: false,
    checked_out: false,
    room_name: mockRooms.find(r => r.id === data.room_id)?.name,
    room_floor: mockRooms.find(r => r.id === data.room_id)?.floor
  };
  // Check conflict
  const conflict = mockBookings.some(b => b.room_id === data.room_id && b.date === data.date && (b.start_hour < data.end_hour && b.end_hour > data.start_hour));
  if (conflict) {
    throw { response: { status: 409 } };
  }
  mockBookings.push(newBooking);
  return newBooking;
};

export const checkInBooking = async (id: number) => {
  const booking = mockBookings.find(b => b.id === id);
  if (booking) {
    booking.checked_in = true;
  }
  return booking;
};

export const checkoutBooking = async (id: number, currentHour: number) => {
  const booking = mockBookings.find(b => b.id === id);
  if (booking) {
    booking.checked_out = true;
    // 如果提早結束，釋放剩下的時間
    if (currentHour < booking.end_hour && currentHour >= booking.start_hour) {
      booking.end_hour = currentHour; 
    }
  }
  return booking;
};

export const cancelBooking = async (id: number) => {
  mockBookings = mockBookings.filter(b => b.id !== id);
  return { success: true };
};

export const releaseGhosts = async (currentDate: string, currentHour: number) => {
  const beforeCount = mockBookings.length;
  mockBookings = mockBookings.filter(b => !(b.date === currentDate && b.start_hour < currentHour && !b.checked_in));
  const released = beforeCount - mockBookings.length;
  return { message: `已釋放 ${released} 筆幽靈預訂`, released };
};

export const getDashboardStats = async (date: string, currentHour: number) => {
  const todaysBookings = mockBookings.filter(b => b.date === date);
  const totalBookings = todaysBookings.length;
  let ghostCount = 0;
  let availableNowCount = mockRooms.length;
  const activeNowRooms = new Set();

  let totalBookedHours = 0;
  todaysBookings.forEach(b => {
    if (b.start_hour < currentHour && !b.checked_in) ghostCount++;
    if (b.start_hour <= currentHour && b.end_hour > currentHour && !b.checked_out) activeNowRooms.add(b.room_id);
    totalBookedHours += (b.end_hour - b.start_hour);
  });

  availableNowCount -= activeNowRooms.size;
  const usageRate = Math.round((totalBookedHours / (mockRooms.length * 10)) * 100);

  return {
    usageRate,
    totalBookings,
    ghostCount,
    availableNowCount
  };
};

export const findAvailableRooms = async (date: string, currentHour: number, capacity: number, building?: string) => {
  const todaysBookings = mockBookings.filter(b => b.date === date);
  const activeNowRooms = new Set();
  
  todaysBookings.forEach(b => {
    if (b.start_hour <= currentHour && b.end_hour > currentHour && !b.checked_out) {
      activeNowRooms.add(b.room_id);
    }
  });

  return mockRooms.filter(r => 
    r.capacity >= capacity && 
    !activeNowRooms.has(r.id) &&
    (building && building !== '所有大樓' ? r.building === building : true)
  );
};

export const findOccupiedBookings = async (date: string, currentHour: number, capacity: number, building?: string) => {
  const todaysBookings = mockBookings.filter(b => b.date === date);
  const occupied = todaysBookings.filter(b => b.start_hour <= currentHour && b.end_hour > currentHour && !b.checked_out);
  
  // 找出這些被佔用的會議室，並且符合人數與大樓條件
  const results: any[] = [];
  occupied.forEach(booking => {
    const room = mockRooms.find(r => r.id === booking.room_id);
    if (room && room.capacity >= capacity && (building && building !== '所有大樓' ? room.building === building : true)) {
      results.push({
        ...booking,
        room_name: room.name,
        room_floor: room.floor,
        room_building: room.building,
        room_capacity: room.capacity
      });
    }
  });

  return results;
};
