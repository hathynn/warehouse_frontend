import React, { useState } from "react";
import { Table, Button, Input } from "antd";
import { Link } from "react-router-dom";
import "./index.scss";

const ImportList = () => {
  const items = [
    {
      order: 1,
      id: "#143567",
      importDate: "01/03/2025",
      supplier: "Nhà cung cấp ABC",
      warehouseLocation: "Kho A",
      importStatus: "Đang xử lý",
      endDate: "07/03/2025",
    },
    {
      order: 2,
      id: "#143568",
      importDate: "06/03/2025",
      supplier: "Nhà cung cấp XYZ",
      warehouseLocation: "Kho B",
      importStatus: "Hoàn tất",
      endDate: "07/03/2025",
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredItems = items.filter((item) =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "STT",
      dataIndex: "order",
      key: "order",
    },
    {
      title: "Mã phiếu nhập",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier",
      key: "supplier",
    },
    {
      title: "Ngày nhập",
      dataIndex: "importDate",
      key: "importDate",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Kho nhập",
      dataIndex: "warehouseLocation",
      key: "warehouseLocation",
    },
    {
      title: "Trạng thái nhập",
      dataIndex: "importStatus",
      key: "importStatus",
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={`detail`}>
          <Button id="btn-detail" type="link">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Danh sách phiếu nhập</h1>
      </div>

      <Input
        placeholder="Tìm kiếm phiếu nhập"
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />

      <Table
        columns={columns}
        dataSource={filteredItems}
        pagination={false}
        rowKey="id"
        className="custom-table"
      />

      <div className="mt-4">
        <Link to="excel">
          <Button type="primary" className="btn" id="btn-detail">
            Tạo Phiếu Nhập
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ImportList;
