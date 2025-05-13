import { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Spin, TablePaginationConfig } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService, {
  ImportOrderResponse,
  ImportStatus
} from "@/hooks/useImportOrderService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import { SearchOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import { AccountRole } from "@/constants/account-roles";
import { UserState } from "@/redux/features/userSlice";
import { useSelector } from "react-redux";
import { ResponseDTO } from "@/hooks/useApi";

interface RouteParams extends Record<string, string | undefined> {
  importRequestId?: string;
}
interface ImportOrderData extends ImportOrderResponse {
  totalExpectQuantityInOrder: number;
  totalActualQuantityInOrder: number;
}

const ImportOrderList: React.FC = () => {
  const userRole = useSelector((state: { user: UserState }) => state.user.role);

  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [importOrdersData, setImportOrdersData] = useState<ImportOrderData[]>([]);
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

  const {
    getImportOrderDetailsPaginated
  } = useImportOrderDetailService();

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

      const formatted: ImportOrderData[] = await Promise.all(
        (response.content ?? []).map(async (order) => {
          // “limit = 1000” đủ để ôm hết chi tiết 1 đơn
          const { content: importOrderDetails = [] } =
            await getImportOrderDetailsPaginated(order.importOrderId, 1, 1000);

          const totalExpectQuantityInOrder = importOrderDetails.reduce(
            (sum, d) => sum + d.expectQuantity,
            0
          );
          const totalActualQuantityInOrder = importOrderDetails.reduce(
            (sum, d) => sum + d.actualQuantity,
            0
          );

          return { ...order, totalExpectQuantityInOrder, totalActualQuantityInOrder };
        })
      );

      setImportOrdersData(formatted);

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

  const filteredItems = importOrdersData.filter((item) =>
    item.importOrderId.toString().includes(searchTerm.toLowerCase()) ||
    item.importRequestId.toString().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "importOrderId",
      key: "importOrderId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      width: "8%",
    },
    {
      title: "Mã phiếu",
      dataIndex: "importRequestId",
      key: "importRequestId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      width: "8%",
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "totalExpectQuantityInOrder",
      key: "totalExpectQuantityInOrder",
      align: "right" as const,
      render: (expect: number) => (
        <div className="text-right text-lg">{expect}</div>
      ),
    },
    {
      title: "Tổng đã nhập",
      dataIndex: "totalActualQuantityInOrder",
      key: "totalActualQuantityInOrder",
      align: "right" as const,
      render: (actual: number, record: ImportOrderData) => {
        const expected = record.totalExpectQuantityInOrder || 0;
        const isEnough = actual >= expected;
        return (
          <div className="text-right">
            {actual === 0 ? (
              <span className="font-bold text-gray-600">Chưa nhập</span>
            ) : (
              <>
                <div className="text-lg">{actual}</div>
                {expected > 0 && (
                  <span className={`font-bold ${isEnough ? 'text-green-600' : 'text-red-600'}`}>
                    {isEnough ? "" : `Thiếu ${expected - actual}`}
                  </span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      title: "Ngày nhận hàng",
      dataIndex: "dateReceived",
      key: "dateReceived",
      align: "center" as const,
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Giờ nhận hàng",
      dataIndex: "timeReceived",
      align: "center" as const,
      key: "timeReceived",
    },
    {
      title: "Người tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      align: "left" as const,
      render: (createdBy: string) => createdBy || "-",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      align: "center" as const,
      key: "createdDate",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ImportStatus) => <StatusTag status={status} type="import" />,
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (_: unknown, record: ImportOrderData) => (
        <Link
          to={ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(
            record.importOrderId.toString()
          )}
        >
          <Button
            id="btn-detail"
            className="!p-2 !text-white !font-bold !bg-blue-900 hover:!bg-blue-500"
            type="link"
          >
            Xem chi tiết
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
        {userRole === AccountRole.DEPARTMENT && (
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackButton}
          >
            {importRequestId
              ? `Quay lại  phiếu nhập #${importRequestId}`
              : 'Quay lại danh sách phiếu nhập'}
          </Button>
        )}
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