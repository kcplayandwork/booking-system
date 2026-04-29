import React from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { createBooking } from '../api';
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
        booker_name: values.booker_name,
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

  const hourOptions = Array.from({ length: 11 }, (_, i) => i + 9).map(h => ({
    value: h,
    label: `${h.toString().padStart(2, '0')}:00`
  }));

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
        <Form.Item
          name="booker_name"
          label="預訂者姓名 / 員工編號"
          rules={[{ required: true, message: '請輸入預訂者' }]}
        >
          <Input placeholder="例如：王小明 / 12345" />
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
          <Select options={[
            { value: 1, label: '1 小時' },
            { value: 2, label: '2 小時' },
            { value: 3, label: '3 小時' },
          ]} />
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
