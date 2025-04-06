import { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Spin } from "antd";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService from "../../../../hooks/useImportOrderService";
import { SearchOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { DEPARTMENT_ROUTER } from "@/constants/routes";

const ImportOrderList = () => {
  const { importRequestId } = useParams();
  const navigate = useNavigate();
  const [importOrders, setImportOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportOrdersByRequestId,
    loading
  } = useImportOrderService();

  useEffect(() => {
    fetchImportOrders();
  }, [pagination.current, pagination.pageSize, importRequestId]);

  const fetchImportOrders = async () => {
    try {
      if (!importRequestId) return;

      const response = await getImportOrdersByRequestId(
        parseInt(importRequestId),
        pagination.current,
        pagination.pageSize
      );

      // Update state with the content array from the response
      if (response && response.content) {
        setImportOrders(response.content);
      }

      // Update pagination with metadata
      if (response && response.metaDataDTO) {
        setPagination({
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        });
      }
    } catch (error) {
      console.error("Failed to fetch import orders:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
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
        return <Tag color="default">Chưa bắt đầu</Tag>;
    }
  };

  const filteredItems = importOrders.filter((item) =>
    item.importOrderId.toString().includes(searchTerm.toLowerCase()) ||
    item.importRequestId.toString().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Mã đơn nhập",
      dataIndex: "importOrderId",
      key: "importOrderId",
      render: (id) => `#${id}`,
      width: '10%',
    },
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      render: (id) => `#${id}`,
      width: '10%',
    },
    {
      title: "Ngày nhận hàng",
      dataIndex: "dateReceived",
      key: "dateReceived",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Giờ nhận hàng",
      dataIndex: "timeReceived",
      key: "timeReceived",
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy) => createdBy || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
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
        <Link to={DEPARTMENT_ROUTER.IMPORT.ORDER.DETAIL(record.importOrderId)}>
          <Button id="btn-detail" className="!p-0" type="link">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  const handleBackToImportRequest = () => {
    navigate(DEPARTMENT_ROUTER.IMPORT.REQUEST.DETAIL(importRequestId));
  };

  return (
    <div className={`mx-auto`}>
      <div className="flex justify-between items-center mb-3">
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToImportRequest}
          >
            Quay lại - Phiếu nhập #{importRequestId}
          </Button>
      </div>
      <h1 className="text-xl font-bold mr-4 mb-3">Danh sách đơn nhập</h1>

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã đơn nhập hoặc mã phiếu nhập"
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
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="importOrderId"
          className="custom-table mb-4"
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '50'],
            showTotal: (total) => `Tổng cộng có ${total} đơn nhập`,
          }}
        />
      )}
    </div>
  );
};

export default ImportOrderList;
