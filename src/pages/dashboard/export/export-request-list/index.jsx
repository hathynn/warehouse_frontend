import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { DEPARTMENT_ROUTER } from "@/constants/routes";

// Dữ liệu cứng cho danh sách phiếu xuất, bổ sung thêm trường status
const fakeExportRequestsData = [
  {
    exportRequestId: 1,
    exportDate: "2025-03-20T00:00:00Z",
    creator: "Nguyễn Văn A",
    receiver: "Trần Thị B",
    exportType: "RETURN", // Xuất trả
    status: "PROCESSING", // Chưa duyệt
  },
  {
    exportRequestId: 2,
    exportDate: "2025-03-19T00:00:00Z",
    creator: "Phạm Văn C",
    receiver: "Lê Thị D",
    exportType: "PRODUCTION", // Xuất sản xuất
    status: "CHECKED", // Đã duyệt
  },
  {
    exportRequestId: 3,
    exportDate: "2025-03-18T00:00:00Z",
    creator: "Hoàng Văn E",
    receiver: "Mai Thị F",
    exportType: "PRODUCTION", // Xuất thanh lý
    status: "EXPORTED", // Đã xuất
  },
  {
    exportRequestId: 4,
    exportDate: "2025-03-17T00:00:00Z",
    creator: "Trần Văn G",
    receiver: "Vũ Thị H",
    exportType: "LOAN", // Xuất mượn
    status: "CANCELLED", // Đã hủy
  },
  {
    exportRequestId: 5,
    exportDate: "2025-03-16T00:00:00Z",
    creator: "Nguyễn Thị I",
    receiver: "Lê Văn K",
    exportType: "RETURN",
    status: "EXPORTED", // Đã duyệt
  },
  // Có thể thêm nhiều object khác nếu cần
];

// Hàm mô phỏng API: phân trang dữ liệu cứng
const simulateFetchExportRequests = (page, pageSize) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = fakeExportRequestsData.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const content = fakeExportRequestsData.slice(startIndex, endIndex);
      resolve({
        content,
        metaDataDTO: {
          page,
          limit: pageSize,
          total,
        },
      });
    }, 500);
  });
};

// Hàm trả về thẻ Tag hiển thị trạng thái phiếu
const getStatusTag = (status) => {
  switch (status) {
    case "PROCESSING":
      return <Tag color="default">Đang xử lý</Tag>;
    case "CHECKED":
      return <Tag color="processing">Đã kiểm kho</Tag>;
    case "EXPORTED":
      return <Tag color="success">Đã xuất kho</Tag>;
    case "CANCELLED":
      return <Tag color="error">Đã hủy</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const getExportTypeText = (type) => {
  switch (type) {
    case "RETURN":
      return "Xuất trả nhà sản xuất";
    case "PRODUCTION":
      return "Xuất sản xuất";
    case "LOAN":
      return "Xuất mượn";
    default:
      return type;
  }
};

const ExportRequestList = () => {
  const [exportRequests, setExportRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExportRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const fetchExportRequests = async () => {
    setLoading(true);
    try {
      const response = await simulateFetchExportRequests(
        pagination.current,
        pagination.pageSize
      );
      if (response && response.content) {
        setExportRequests(response.content);
      }
      if (response && response.metaDataDTO) {
        setPagination((prev) => ({
          ...prev,
          total: response.metaDataDTO.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch export requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (pag) => {
    setPagination({
      ...pagination,
      current: pag.current,
      pageSize: pag.pageSize,
    });
  };

  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "exportRequestId",
      key: "exportRequestId",
      render: (id) => `#${id}`,
      width: "15%",
    },
    {
      title: "Ngày xuất",
      dataIndex: "exportDate",
      key: "exportDate",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Người lập phiếu",
      dataIndex: "creator",
      key: "creator",
    },
    {
      title: "Người nhận hàng",
      dataIndex: "receiver",
      key: "receiver",
    },
    {
      title: "Loại xuất",
      dataIndex: "exportType",
      key: "exportType",
      render: (type) => getExportTypeText(type),
    },
    {
      title: "Trạng thái phiếu",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text, record) => (
        <Link
          to={DEPARTMENT_ROUTER.EXPORT.REQUEST.DETAIL(record.exportRequestId)}
        >
          <Button id="btn-detail" className="!p-0" type="link">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  const filteredItems = exportRequests.filter((item) =>
    item.exportRequestId
      .toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto">
      <h1 className="text-xl font-bold mb-4">Danh sách phiếu xuất</h1>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm kiếm theo mã phiếu xuất"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          className="max-w-md"
        />
        <Link to={DEPARTMENT_ROUTER.EXPORT.REQUEST.CREATE}>
          <Button type="primary" id="btn-create" icon={<PlusOutlined />}>
            Tạo Phiếu Xuất
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="exportRequestId"
        className="custom-table mb-4"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ["10", "50"],
          showTotal: (total) => `Tổng cộng có ${total} phiếu xuất`,
        }}
      />
    </div>
  );
};

export default ExportRequestList;
