import React, { useState } from "react";
import { Table, Button, Descriptions, Modal } from "antd";
import { Link } from "react-router-dom";
import "./index.scss";

const ImportReportDetail = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const itemDetail = {
    id: "#143567",
    importStatus: "Đang xử lý",
    itemStatus: "Thiếu",
    supplier: "Nhà cung cấp ABC",
    phoneNumber: "0903897675",
    createdBy: "John Doe",
    expectedDate: "12/3/2025",
    reason: "Nhập khẩu định kỳ",
  };

  const additionalItems = [
    {
      id: "I145678",
      name: "Item A",
      quantityRequired: 20,
      quantityShipped: 10,
      unit: "Xấp",
      status: "Thiếu",
    },
    {
      id: "I234567",
      name: "Item B",
      quantityRequired: 30,
      quantityShipped: 20,
      unit: "Xấp",
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
          onClick={() => showDetailModal(record)}
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

  const showModal = () => {
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const showDetailModal = (record) => {
    setIsDetailModalVisible(true);
  };

  const hideDetailModal = () => {
    setIsDetailModalVisible(false);
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          Chi tiết phiếu nhập {itemDetail.id}
        </h1>
      </div>

      <Descriptions title="Thông tin chi tiết" bordered>
        <Descriptions.Item label="Trạng thái nhập">
          {itemDetail.importStatus}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hàng">
          {itemDetail.itemStatus}
        </Descriptions.Item>
        <Descriptions.Item label="Nhà cung cấp">
          {itemDetail.supplier}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {itemDetail.phoneNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo phiếu">
          {itemDetail.createdBy}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày giao dự kiến">
          {itemDetail.expectedDate}
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
        <Button type="primary" className="btn" onClick={showModal}>
          Danh sách đơn nhập thuộc phiếu nhập
        </Button>
      </div>

      {/* Modal danh sách đơn nhập */}
      <Modal
        title="Danh sách đơn nhập thuộc phiếu nhập"
        visible={isModalVisible}
        onCancel={hideModal}
        footer={null}
        width={800}
        className="modal-custom"
      >
        <Table
          columns={columns}
          dataSource={orderData}
          pagination={false}
          rowKey="key"
        />
      </Modal>

      {/* Modal chi tiết đơn nhập */}
      <Modal
        visible={isDetailModalVisible}
        onCancel={hideDetailModal}
        footer={null}
        width={1000}
        className="modal-custom"
      >
        <Descriptions
          title="Thông tin chi tiết đơn nhập"
          className="des"
          bordered
        >
          <Descriptions.Item label="Nhân viên được assign">
            Nguyễn Văn A
          </Descriptions.Item>
          <Descriptions.Item label="Ngày giờ giao hàng">
            12/3/2025
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái phiếu nhập">
            Đang xử lý
          </Descriptions.Item>
          <Descriptions.Item label="Mã phiếu nhập">#12345</Descriptions.Item>
        </Descriptions>

        <Table
          columns={[
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
          ]}
          dataSource={additionalItems}
          pagination={false}
          rowKey="id"
        />
      </Modal>
    </div>
  );
};

export default ImportReportDetail;
