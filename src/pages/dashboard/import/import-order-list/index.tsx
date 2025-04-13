import { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Spin, TablePaginationConfig } from "antd";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService, { 
  ImportOrderResponse, 
  ImportStatus,
  ResponseDTO 
} from "@/hooks/useImportOrderService";
import { SearchOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";

interface RouteParams extends Record<string, string> {
  importRequestId?: string;
}

const ImportOrderList: React.FC = () => {
  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [importOrders, setImportOrders] = useState<ImportOrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportOrdersByRequestId,
    getAllImportOrders,
    loading
  } = useImportOrderService();

  useEffect(() => {
    fetchImportOrders();
  }, [pagination.current, pagination.pageSize, importRequestId]);

  const fetchImportOrders = async (): Promise<void> => {
    try {
      let response: ResponseDTO<ImportOrderResponse[]>;
      
      if (importRequestId) {
        response = await getImportOrdersByRequestId(
          parseInt(importRequestId),
          pagination.current || 1,
          pagination.pageSize || 10
        );
      } else {
        response = await getAllImportOrders(
          pagination.current || 1,
          pagination.pageSize || 10
        );
      }

      if (response && response.content) {
        setImportOrders(response.content);
      }

      if (response && response.metadata) {
        setPagination({
          current: response.metadata.page,
          pageSize: response.metadata.limit,
          total: response.metadata.totalElements,
        });
      }
    } catch (error) {
      console.error("Failed to fetch import orders:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const getStatusTag = (status: ImportStatus): React.ReactNode => {
    switch (status) {
      case ImportStatus.NOT_STARTED:
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case ImportStatus.IN_PROGRESS:
        return <Tag color="processing">Đang xử lý</Tag>;
      case ImportStatus.COMPLETED:
        return <Tag color="success">Hoàn tất</Tag>;
      case ImportStatus.CANCELLED:
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
      render: (id: number) => `#${id}`,
      width: '10%',
    },
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      render: (id: number) => `#${id}`,
      width: '10%',
    },
    {
      title: "Ngày nhận hàng",
      dataIndex: "dateReceived",
      key: "dateReceived",
      render: (date: string) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
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
      render: (createdBy: string) => createdBy || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedDate",
      key: "updatedDate",
      render: (date: string) => date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ImportStatus) => getStatusTag(status),
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (_: unknown, record: ImportOrderResponse) => (
        <Link to={ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(record.importOrderId.toString())}>
          <Button id="btn-detail" className="!p-0" type="link">
            Chi tiết
          </Button>
        </Link>
      ),
    },
  ];

  const handleBackButton = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequestId));
    } else {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
    }
  };

  return (
    <div className={`mx-auto`}>
      <div className="flex justify-between items-center mb-3">
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={handleBackButton}
        >
          {importRequestId 
            ? `Quay lại - Phiếu nhập #${importRequestId}`
            : 'Quay lại danh sách phiếu nhập'}
        </Button>
      </div>
      <h1 className="text-xl font-bold mr-4 mb-3">
        {importRequestId 
          ? `Danh sách đơn nhập - Phiếu nhập #${importRequestId}`
          : 'Danh sách tất cả đơn nhập'}
      </h1>

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
            showTotal: (total: number) => `Tổng cộng có ${total} đơn nhập`,
          }}
        />
      )}
    </div>
  );
};

export default ImportOrderList; 