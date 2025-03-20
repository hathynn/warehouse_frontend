import React, { useState, useEffect } from "react";
import { Button, Input, Select, Table, Typography, Space, Card, DatePicker, TimePicker } from "antd";
import useImportOrderService from "../../../../hooks/useImportOrderService";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import { toast } from "react-toastify";
import moment from "moment";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ImportOrderCreate = () => {
  const [importRequests, setImportRequests] = useState([]);
  const [selectedImportRequest, setSelectedImportRequest] = useState(null);
  const [importRequestDetails, setImportRequestDetails] = useState([]);
  const [formData, setFormData] = useState({
    importRequestId: null,
    accountId: 1, // Assuming current user ID, should be dynamic in real app
    dateReceived: moment().format("YYYY-MM-DD"),
    timeReceived: moment().format("HH:mm:ss"),
    note: "",
    status: "PENDING"
  });

  const {
    loading: importOrderLoading,
    createImportOrder,
  } = useImportOrderService();

  const {
    loading: importRequestLoading,
    getAllImportRequests,
    getImportRequestDetails
  } = useImportRequestService();

  // Fetch import requests
  useEffect(() => {
    const fetchImportRequests = async () => {
      try {
        const data = await getAllImportRequests();
        setImportRequests(data || []);
      } catch (error) {
        console.error("Error fetching import requests:", error);
      }
    };

    fetchImportRequests();
  }, []);

  // Fetch import request details when a request is selected
  useEffect(() => {
    if (selectedImportRequest) {
      fetchImportRequestDetails(selectedImportRequest);
    }
  }, [selectedImportRequest]);

  const fetchImportRequestDetails = async (importRequestId) => {
    try {
      const details = await getImportRequestDetails(importRequestId);
      setImportRequestDetails(details || []);
      setFormData({
        ...formData,
        importRequestId: importRequestId
      });
    } catch (error) {
      console.error("Error fetching import request details:", error);
    }
  };

  const handleImportRequestChange = (value) => {
    setSelectedImportRequest(value);
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dateReceived: date ? date.format("YYYY-MM-DD") : null
    });
  };

  const handleTimeChange = (time) => {
    setFormData({
      ...formData,
      timeReceived: time ? time.format("HH:mm:ss") : null
    });
  };

  const handleSubmit = async () => {
    if (!formData.importRequestId) {
      toast.error("Vui lòng chọn phiếu nhập");
      return;
    }
    
    try {
      // Create import order
      await createImportOrder(formData);
      
      toast.success("Tạo đơn nhập kho thành công!");
      
      // Reset form after successful creation
      setFormData({
        importRequestId: null,
        accountId: 1,
        dateReceived: moment().format("YYYY-MM-DD"),
        timeReceived: moment().format("HH:mm:ss"),
        note: "",
        status: "PENDING"
      });
      setSelectedImportRequest(null);
      setImportRequestDetails([]);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "expectQuantity",
      key: "expectQuantity",
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    }
  ];

  const loading = importOrderLoading || importRequestLoading;

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo đơn nhập kho</Title>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin đơn nhập" className="w-1/3">
          <Space direction="vertical" className="w-full">
            <div>
              <label className="block mb-1">Chọn phiếu nhập</label>
              <Select
                placeholder="Chọn phiếu nhập"
                value={selectedImportRequest}
                onChange={handleImportRequestChange}
                className="w-full"
              >
                {importRequests.map((request) => (
                  <Option key={request.importRequestId} value={request.importRequestId}>
                    Phiếu nhập #{request.importRequestId} - {request.importReason}
                  </Option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block mb-1">Ngày nhận</label>
              <DatePicker 
                className="w-full" 
                value={formData.dateReceived ? moment(formData.dateReceived) : null}
                onChange={handleDateChange}
              />
            </div>
            
            <div>
              <label className="block mb-1">Giờ nhận</label>
              <TimePicker 
                className="w-full" 
                value={formData.timeReceived ? moment(formData.timeReceived, "HH:mm:ss") : null}
                onChange={handleTimeChange}
                format="HH:mm:ss"
              />
            </div>
            
            <div>
              <label className="block mb-1">Ghi chú</label>
              <TextArea
                placeholder="Nhập ghi chú"
                rows={4}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                className="w-full"
              />
            </div>
            
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={loading}
              className="w-full mt-4"
              id="btn-detail"
            >
              Xác nhận tạo đơn nhập
            </Button>
          </Space>
        </Card>
        
        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ phiếu nhập">
            <Table 
              columns={columns} 
              dataSource={importRequestDetails} 
              rowKey="importRequestDetailId"
              pagination={{ pageSize: 10 }}
              className="custom-table"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImportOrderCreate;
