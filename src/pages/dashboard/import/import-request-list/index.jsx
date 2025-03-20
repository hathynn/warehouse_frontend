import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Pagination, Spin } from "antd";
import { Link } from "react-router-dom";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

const ImportRequestList = () => {
  const [importRequests, setImportRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  const { 
    getImportRequestsByPage, 
    loading 
  } = useImportRequestService();

  useEffect(() => {
    fetchImportRequests();
  }, [currentPage, pageSize]);

  const fetchImportRequests = async () => {
    try {
      const data = await getImportRequestsByPage(currentPage, pageSize);
      setImportRequests(data);
      // Assuming the API returns total count in the future
      setTotal(data.length > 0 ? data.length * 10 : 0); // Temporary solution
    } catch (error) {
      console.error("Failed to fetch import requests:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing">Đang xử lý</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getImportTypeText = (type) => {
    switch (type) {
      case "ORDER":
        return "Đơn hàng";
      case "RETURN":
        return "Trả hàng";
      default:
        return type;
    }
  };

  const filteredItems = importRequests.filter((item) =>
    item.importRequestId.toString().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
      width: 70,
    },
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      render: (id) => `#${id}`,
      width: '10%',
    },
    {
      title: "Loại nhập",
      dataIndex: "importType",
      key: "importType",
      render: (type) => getImportTypeText(type),
    },
    {
      title: "Lý do nhập",
      dataIndex: "importReason",
      key: "importReason",
      ellipsis: true,
      width: '20%'
    },
    {
      title: "Mã nhà cung cấp",
      dataIndex: "providerId",
      key: "providerId",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedDate",
      key: "updatedDate",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link to={`${record.importRequestId}`}>
          <Button id="btn-detail" className="!p-0" type="link">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  return (
    <div className={`mx-auto p-5`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Danh sách phiếu nhập</h1>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã phiếu nhập"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={filteredItems}
            pagination={false}
            rowKey="importRequestId"
            className="mb-4"
          />

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger
            showTotal={(total) => `Tổng ${total} phiếu nhập`}
          />
        </>
      )}

      <div className="mt-4">
        <Link to="excel">
          <Button 
            type="primary" 
            id="btn-create" 
            icon={<PlusOutlined />}
          >
            Tạo Phiếu Nhập
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ImportRequestList;
