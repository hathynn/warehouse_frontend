import React, { useState, useEffect } from "react";
import { Table, Button, Input, message } from "antd";
import { Link } from "react-router-dom";
import useItemService from "../../../../hooks/useItemService";
import "./index.scss";

const ImportProductList = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { getItems, loading } = useItemService();

  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize]);

  const fetchItems = async () => {
    try {
      const response = await getItems(currentPage, pageSize);
      console.log(response);
      if (response && Array.isArray(response)) {
        setItems(response);
        setTotal(response.length > 0 ? response.length : 0);
      }
    } catch (error) {
      message.error("Không thể tải danh sách hàng hóa");
      console.error("Error fetching items:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
    },
    {
      title: "Loại đơn vị",
      dataIndex: "unitType",
      key: "unitType",
    },
    {
      title: "Số lượng tối thiểu",
      dataIndex: "minimumStockQuantity",
      key: "minimumStockQuantity",
      render: (text) => text || "Chưa thiết lập",
    },
    {
      title: "Số lượng tối đa",
      dataIndex: "maximumStockQuantity",
      key: "maximumStockQuantity",
      render: (text) => text || "Chưa thiết lập",
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={`/dashboard/items/${record.id}`}>
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
          <Link to="request-list">
            <Button className="btn" id="btn-detail">
              Danh sách phiếu nhập
            </Button>
          </Link>
          <Link to="import-order-list">
            <Button className="btn" id="btn-detail">
              Danh sách đơn nhập
            </Button>
          </Link>
        </div>
      </div>

      <Input
        placeholder="Tìm kiếm tên hàng"
        value={searchTerm}
        onChange={handleSearchChange}
        className="!mb-4"
      />

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
        className="custom-table"
        loading={loading}
        pagination={{ pageSize: 1 }}
      />
    </div>
  );
};

export default ImportProductList;
