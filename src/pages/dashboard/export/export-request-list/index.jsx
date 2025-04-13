import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag } from "antd";
import { Link } from "react-router-dom";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import useExportRequestService from "../../../../hooks/useExportRequestService";
import { useSelector } from "react-redux";

const ExportRequestList = () => {
  const [exportRequests, setExportRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { getExportRequestsByPage, loading } = useExportRequestService();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    fetchExportRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current, pagination.pageSize]);

  const fetchExportRequests = async () => {
    try {
      const response = await getExportRequestsByPage(
        pagination.current,
        pagination.pageSize
      );
      if (response && response.content) {
        // Mapping các trường từ API:
        // Sử dụng item.exportRequestId làm id (do response trả về exportRequestId, không phải item.id)
        const mappedRequests = response.content.map((item) => ({
          id: item.exportRequestId, // Sử dụng trường exportRequestId từ API
          exportDate: item.exportDate,
          createdBy: item.createdBy ? item.createdBy : "anonymousUser",
          receiverName: item.receiverName,
          exportType: item.type,
          status: item.status,
        }));
        setExportRequests(mappedRequests);
      }
      // Cập nhật phân trang theo cấu trúc metaDataDTO (theo mẫu của luồng nhập)
      if (response && response.metaDataDTO) {
        setPagination({
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        });
      }
    } catch (error) {
      console.error("Failed to fetch export requests:", error);
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
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getExportTypeText = (type) => {
    switch (type) {
      case "RETURN":
        return "Xuất trả nhà cung cấp";
      case "PRODUCTION":
        return "Xuất sử dụng";
      case "BORROWING":
        return "Xuất mượn";
      default:
        return type;
    }
  };

  // Lọc danh sách theo mã phiếu xuất
  const filteredItems = exportRequests.filter((item) => {
    const idStr = item.id ? item.id.toString() : "";
    return idStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "id",
      key: "id",
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
      dataIndex: "createdBy",
      key: "createdBy",
    },
    {
      title: "Người nhận hàng",
      dataIndex: "receiverName",
      key: "receiverName",
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
        <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(record.id)}>
          <Button id="btn-detail" className="!p-2 !text-white !font-bold !bg-blue-900 hover:!bg-blue-500" type="link">
            Xem chi tiết
          </Button>
        </Link>
      ),
    },
  ];

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
        {user?.role === "ROLE_DEPARTMENT" && (
          <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.CREATE}>
            <Button type="primary" id="btn-create" icon={<PlusOutlined />}>
              Tạo Phiếu Xuất
            </Button>
          </Link>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="id"
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
