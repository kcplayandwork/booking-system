import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import dayjs from 'dayjs';
import api from '../api';

interface BookingModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialRoom: any;
  initialTime: string | null;
  date: string;
}

const { Option } = Select;
const { TextArea } = Input;

const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialRoom,
  initialTime,
  date
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        room_name: initialRoom?.name,
        start_time: initialTime,
        duration: 60, // Default 1 hour
      });
    } else {
      form.resetFields();
    }
  }, [visible, initialRoom, initialTime, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Calculate end_time based on start_time and duration
      const startDayjs = dayjs(\`\${date} \${values.start_time}\`);
      const endDayjs = startDayjs.add(values.duration, 'minute');
      const end_time = endDayjs.format('HH:mm');

      const payload = {
        room_id: initialRoom?.id,
        title: values.title,
        booker_name: values.booker_name,
        date: date,
        start_time: values.start_time,
        end_time: end_time,
        notes: values.notes
      };

      await api.post('/bookings', payload);
      message.success('預約成功！');
      onSuccess();
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else if (error.errorFields) {
        // Form validation error, handled by UI
      } else {
        message.error('預約失敗，請稍後再試');
      }
    }
  };

  // Generate start time options (09:00 - 18:45)
  const startTimeOptions = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19) break; // End at 19:00, so last start time is 18:45
      const timeString = \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`;
      startTimeOptions.push(<Option key={timeString} value={timeString}>{timeString}</Option>);
    }
  }

  return (
    <Modal
      title="新增會議室預約"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="確認預約"
      cancelText="取消"
      okButtonProps={{ style: { backgroundColor: '#007A5E' } }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="會議室" name="room_name">
          <Input disabled />
        </Form.Item>
        
        <Form.Item 
          label="會議主題" 
          name="title" 
          rules={[{ required: true, message: '請輸入會議主題' }]}
        >
          <Input placeholder="例如：Q3 業績檢討會議" />
        </Form.Item>

        <Form.Item 
          label="預訂者姓名" 
          name="booker_name" 
          rules={[{ required: true, message: '請輸入預訂者姓名' }]}
        >
          <Input placeholder="請輸入您的姓名" />
        </Form.Item>

        <Form.Item label="開始時間" name="start_time" rules={[{ required: true }]}>
          <Select>
            {startTimeOptions}
          </Select>
        </Form.Item>

        <Form.Item label="使用時數" name="duration" rules={[{ required: true }]}>
          <Select>
            <Option value={15}>15 分鐘</Option>
            <Option value={30}>30 分鐘</Option>
            <Option value={45}>45 分鐘</Option>
            <Option value={60}>1 小時</Option>
            <Option value={90}>1.5 小時</Option>
            <Option value={120}>2 小時</Option>
            <Option value={180}>3 小時</Option>
          </Select>
        </Form.Item>

        <Form.Item label="備註" name="notes">
          <TextArea rows={3} placeholder="其他需求（選填）" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingModal;
