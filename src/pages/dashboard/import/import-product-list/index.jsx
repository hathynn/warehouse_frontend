import React, { useState } from "react";
import { Table, Button, Input } from "antd";
import { Link } from "react-router-dom";
import "./index.scss";

const ImportProductList = () => {
  const items = [
    {
      id: "#143567",
      name: "Vải Kaki",
      quantity: "100",
      unit: "Xấp",
      supplier: "Nhà cung cấp ABC",
      warehouseLocation: "Kho A",
      status: "Thiếu",
      importDate: "07/03/2025",
    },
    {
      id: "#143569",
      name: "Vải nhung",
      quantity: "100",
      unit: "Xấp",
      supplier: "Nhà cung cấp XYZ",
      warehouseLocation: "Kho B",
      status: "Đủ",
      importDate: "07/03/2025",
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
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
      title: "Số lượng tồn kho",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Nhà phân phối",
      dataIndex: "supplier",
      key: "supplier",
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={``}>
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
        <h1 className="text-xl font-bold">Danh sách hàng hóa</h1>
        <div className="space-x-2">
          <Link to="add-product">
            <Button type="primary" className="btn" id="btn-detail">
              Thêm hàng hóa
            </Button>
          </Link>
          <Link to="report-list">
            <Button className="btn" id="btn-detail">
              Danh sách phiếu nhập
            </Button>
          </Link>
        </div>
      </div>

      <Input
        placeholder="Tìm kiếm tên hàng"
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

export default ImportProductList;
