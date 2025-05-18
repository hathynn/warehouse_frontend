import { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Spin, TablePaginationConfig, Tooltip } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService, {
  ImportOrderResponse,
  ImportStatus
} from "@/hooks/useImportOrderService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import { AccountRole, AccountRoleForRequest } from "@/constants/account-roles";
import { UserState } from "@/redux/features/userSlice";
import { useSelector } from "react-redux";
import { ResponseDTO } from "@/hooks/useApi";
import useAccountService, { AccountResponse } from "@/hooks/useAccountService";

interface RouteParams extends Record<string, string | undefined> {
  importRequestId?: string;
}
interface ImportOrderData extends ImportOrderResponse {
  importOrderDetailsCount: number;
  importOrderDetailsCompletedCount: number;
  totalExpectQuantityInOrder: number;
  totalActualQuantityInOrder: number;
}

const ImportOrderList: React.FC = () => {
  const userRole = useSelector((state: { user: UserState }) => state.user.role);
  const navigate = useNavigate();
  const { importRequestId } = useParams<RouteParams>();
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
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

  const {
    getAccountsByRole
  } = useAccountService();

  useEffect(() => {
    fetchImportOrders();
  }, [pagination.current, pagination.pageSize, importRequestId]);

  useEffect(() => {
    fetchAccountsByRole();
  }, []);

  const fetchAccountsByRole = async (): Promise<void> => {
    try {
      const response = await getAccountsByRole(AccountRoleForRequest.STAFF);
      setStaffs(response || []);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

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
          const importOrderDetailsCompletedCount = importOrderDetails.reduce(
            (sum, d) => sum + (d.actualQuantity > 0 ? 1 : 0),
            0
          );

          return { 
            ...order, 
            importOrderDetailsCount: importOrderDetails.length, 
            importOrderDetailsCompletedCount, 
            totalExpectQuantityInOrder, 
            totalActualQuantityInOrder 
          };
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
      width: "10%",
      title: "Mã đơn",
      dataIndex: "importOrderId",
      key: "importOrderId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "10%",
      title: "Mã phiếu",
      dataIndex: "importRequestId",
      key: "importRequestId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Số mặt hàng cần nhập",
      dataIndex: "importOrderDetailsCount",
      key: "importOrderDetailsCount",
      align: "right" as const,
      render: (count: number) => (
        <div className="text-right text-lg">{count}</div>
      ),
    },
    {
      title: "Số mặt hàng đã nhập đủ",
      dataIndex: "importOrderDetailsCompletedCount",
      key: "importOrderDetailsCompletedCount",
      align: "right" as const,
      render: (count: number) => (
        <div className="text-right text-lg">{count}</div>
      ),
    },
    // {
    //   title: "Tổng đã lên đơn",
    //   dataIndex: "totalExpectQuantityInOrder",
    //   key: "totalExpectQuantityInOrder",
    //   align: "right" as const,
    //   render: (expect: number) => (
    //     <div className="text-right text-lg">{expect}</div>
    //   ),
    // },
    // {
    //   title: "Tổng đã nhập",
    //   dataIndex: "totalActualQuantityInOrder",
    //   key: "totalActualQuantityInOrder",
    //   align: "right" as const,
    //   render: (actual: number, record: ImportOrderData) => {
    //     const expected = record.totalExpectQuantityInOrder || 0;
    //     const isEnough = actual >= expected;
    //     return (
    //       <div className="text-right">
    //         {actual === 0 ? (
    //           <span className="font-bold text-gray-600">Chưa nhập</span>
    //         ) : (
    //           <>
    //             <div className="text-lg">{actual}</div>
    //             {expected > 0 && (
    //               <span className={`font-bold ${isEnough ? 'text-green-600' : 'text-red-600'}`}>
    //                 {isEnough ? "" : `Thiếu ${expected - actual}`}
    //               </span>
    //             )}
    //           </>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Thời điểm nhận hàng",
      key: "receivedDateTime",
      align: "center" as const,
      dataIndex: "dateReceived",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportOrderData) => {
        const { dateReceived, timeReceived } = record;
        if (!dateReceived || !timeReceived) return "-";
        const [year, month, day] = dateReceived.split("-");
        const formattedDate = `${day}-${month}-${year}`;
        const formattedTime = timeReceived.slice(0, 5); // HH:mm
        return (
          <>
            <div>Ngày <b>{formattedDate}</b></div>
            <div>Lúc <b>{formattedTime}</b></div>
          </>
        );
      }
    },
    {
      width: "15%",
      title: "Phân công cho",
      dataIndex: "assignedStaffId",
      key: "assignedStaffId",
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (assignedStaffId: number) => {
        if (!assignedStaffId) return "-";
        const staff = staffs.find((s) => s.id === assignedStaffId);
        return staff?.fullName
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (status: ImportStatus) => <StatusTag status={status} type="import" />,
    },
    {
      title: "Hành động",
      key: "action",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: unknown, record: ImportOrderData) => (
        <Tooltip title="Xem chi tiết đơn nhập" placement="top">
          <Link to={ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(record.importOrderId.toString())}>
            <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
              <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
            </span>
          </Link>
        </Tooltip>
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
            pageSizeOptions: ['10', '20', '50', '100'],
            locale: {
              items_per_page: "/ trang"
            },
            showTotal: (total: number) => `Tổng cộng có ${total} đơn nhập`,
          }}
        />
      )}
    </div>
  );
};

export default ImportOrderList; 