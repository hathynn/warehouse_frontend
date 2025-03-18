import React, { useState } from "react";
import { Table, Button, Descriptions, Modal } from "antd";
import "./index.scss";

const ReportDetail = () => {
  const [isModalVisible, setIsModalVisible] = useState(false); // State để điều khiển hiển thị modal
  const [selectedOrder, setSelectedOrder] = useState(null); // State để lưu thông tin của dòng được chọn
  const [showOrderList, setShowOrderList] = useState(false); // Trạng thái để hiển thị danh sách đơn nhập

  const itemDetail = {
    id: "#143567",
    importStatus: "Đang xử lý",
    createdBy: "Nguyễn Văn A",
    createdDate: "12/3/2025",
    reason: "Nhập khẩu định kỳ",
    expectedCompleteDate: "20/3/2025",
    endDate: "",
    priority: "Cao",
  };

  const additionalItems = [
    {
      id: "I145678",
      name: "Vải Kaki",
      quantityRequired: 20,
      quantityShipped: 10,
      unit: "Cuộn",
      status: "Thiếu",
    },
    {
      id: "I234567",
      name: "Chỉ hồng",
      quantityRequired: 30,
      quantityShipped: 20,
      unit: "Cuộn",
      status: "Thiếu",
    },
  ];

  const orderData = [
    {
      key: "1",
      id: "#12345",
      assignedTo: "Nguyễn Văn A",
      status: "Đang xử lý",
    },
    {
      key: "2",
      id: "#12346",
      assignedTo: "Trần Thị B",
      status: "Hoàn thành",
    },
  ];

  const columns = [
    {
      title: "Số thứ tự",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Mã phiếu nhập",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nhân viên được assign",
      dataIndex: "assignedTo",
      key: "assignedTo",
    },
    {
      title: "Trạng thái phiếu nhập",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Chi tiết",
      render: (text, record) => (
        <Button
          type="primary"
          className="btn"
          onClick={() => handleExpandRow(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const columnsMain = [
    {
      title: "Mã hàng",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Tên hàng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số lượng cần giao",
      dataIndex: "quantityRequired",
      key: "quantityRequired",
    },
    {
      title: "Số lượng đã giao",
      dataIndex: "quantityShipped",
      key: "quantityShipped",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Trạng thái item",
      dataIndex: "status",
      key: "status",
    },
  ];

  const handleExpandRow = (record) => {
    setSelectedOrder(record); // Lưu thông tin của dòng được chọn
    setIsModalVisible(true); // Mở modal
  };

  const handleCloseModal = () => {
    setIsModalVisible(false); // Đóng modal
    setSelectedOrder(null); // Xóa thông tin của dòng được chọn
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          Chi tiết phiếu nhập {itemDetail.id}
        </h1>
      </div>

      <Descriptions title="Thông tin chi tiết" bordered>
        <Descriptions.Item label="Trạng thái phiếu nhập">
          {itemDetail.importStatus}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày cần hoàn thành">
          {itemDetail.expectedCompleteDate}
        </Descriptions.Item>
        <Descriptions.Item label="Độ ưu tiên">
          {itemDetail.priority}
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo phiếu">
          {itemDetail.createdBy}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo phiếu">
          {itemDetail.createdDate}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc">
          {itemDetail.endDate}
        </Descriptions.Item>
        <Descriptions.Item label="Lý do nhập kho">
          {itemDetail.reason}
        </Descriptions.Item>
      </Descriptions>

      <Table
        columns={columnsMain}
        dataSource={additionalItems}
        pagination={false}
        rowKey="id"
        className="custom-table mt-4"
      />

      <div className="mt-4">
        <Button
          type="primary"
          className="btn"
          onClick={() => setShowOrderList(!showOrderList)}
        >
          Danh sách đơn nhập thuộc phiếu nhập
        </Button>
      </div>

      {/* Hiển thị danh sách đơn nhập trực tiếp bên dưới */}
      {showOrderList && (
        <div className="order-list-section mt-4">
          <Table
            columns={columns}
            dataSource={orderData}
            pagination={false}
            rowKey="key"
          />
        </div>
      )}

      {/* Modal hiển thị thông tin chi tiết */}
      <Modal
        title={`Chi tiết đơn nhập ${selectedOrder?.id}`}
        visible={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        className="modal-custom"
      >
        {selectedOrder && (
          <div className="detail-section">
            <Descriptions bordered>
              <Descriptions.Item label="Nhân viên được assign">
                {selectedOrder.assignedTo}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày giờ giao hàng">
                12/3/2025
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái phiếu nhập">
                {selectedOrder.status}
              </Descriptions.Item>
              <Descriptions.Item label="Mã phiếu nhập">
                {selectedOrder.id}
              </Descriptions.Item>
            </Descriptions>
            <Table
              columns={columnsMain}
              dataSource={additionalItems}
              pagination={false}
              rowKey="id"
              className="mt-4"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportDetail;
