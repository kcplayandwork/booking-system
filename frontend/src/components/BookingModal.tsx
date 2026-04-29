import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { createBooking, currentUser, formatTime } from '../api';
import { format } from 'date-fns';

interface BookingModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  selectedRoom: any;
  selectedHour: number | null;
  selectedDate: Date;
}

const BookingModal: React.FC<BookingModalProps> = ({ visible, onCancel, onSuccess, selectedRoom, selectedHour, selectedDate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (visible && selectedHour !== null) {
      form.setFieldsValue({
        start_hour: selectedHour,
        duration: 1,
        capacity: 4
      });
    }
  }, [visible, selectedHour, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        room_id: selectedRoom.id,
        title: values.title,
        booker_name: currentUser.name,
        emp_id: currentUser.empId,
        email: currentUser.email,
        capacity: values.capacity,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_hour: values.start_hour,
        end_hour: values.start_hour + values.duration,
      };

      await createBooking(payload);
      message.success('預訂成功！');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        message.error('該時段已被預訂或發生衝突，請選擇其他時段');
      } else if (error.name === 'ValidationError') {
        // Form validation error, do nothing
      } else {
        message.error('預訂失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  const hourOptions = Array.from({ length: 40 }, (_, i) => 9 + i * 0.25).map(h => ({
    value: h,
    label: formatTime(h)
  }));

  const durationOptions = [
    { value: 0.25, label: '15 分鐘' },
    { value: 0.5, label: '30 分鐘' },
    { value: 0.75, label: '45 分鐘' },
    { value: 1, label: '1 小時' },
    { value: 1.5, label: '1.5 小時' },
    { value: 2, label: '2 小時' },
    { value: 3, label: '3 小時' },
  ];

  return (
    <Modal
      title={`預訂會議室 - ${selectedRoom?.name} (${selectedRoom?.floor})`}
      open={visible}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      confirmLoading={loading}
      okText="確認預訂"
      cancelText="取消"
      okButtonProps={{ style: { backgroundColor: '#007A5E' } }}
    >
      <div style={{ marginBottom: 16, color: '#6B7280' }}>
        日期：{format(selectedDate, 'yyyy-MM-dd')}
      </div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="會議主題"
          rules={[{ required: true, message: '請輸入會議主題' }]}
        >
          <Input placeholder="例如：產品發布準備會議" />
        </Form.Item>
        <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}>預訂人資訊 (系統自動帶入)</div>
          <div style={{ color: '#1A1A1A', fontWeight: 'bold' }}>{currentUser.name}</div>
          <div style={{ color: '#6B7280', fontSize: '13px' }}>員編: {currentUser.empId}</div>
          <div style={{ color: '#6B7280', fontSize: '13px' }}>Email: {currentUser.email}</div>
        </div>
        <Form.Item
          name="capacity"
          label="開會人數"
          rules={[{ required: true, message: '請輸入開會人數' }]}
        >
          <Input type="number" min={1} max={selectedRoom?.capacity} suffix="人" />
        </Form.Item>
        <Form.Item
          name="start_hour"
          label="開始時間"
          rules={[{ required: true, message: '請選擇開始時間' }]}
        >
          <Select options={hourOptions} disabled />
        </Form.Item>
        <Form.Item
          name="duration"
          label="使用時數"
          rules={[{ required: true, message: '請選擇使用時數' }]}
        >
          <Select options={durationOptions} />
        </Form.Item>
        <Form.Item
          name="remarks"
          label="備註 (選填)"
        >
          <Input.TextArea rows={2} placeholder="如有特殊需求請備註" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingModal;
