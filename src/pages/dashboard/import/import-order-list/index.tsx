import { useState, useEffect } from "react";
import { Table, Button, Input, Spin, TablePaginationConfig, Tooltip, Space, Select } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService, {
  ImportOrderResponse,
} from "@/hooks/useImportOrderService";
import useImportOrderDetailService from "@/hooks/useImportOrderDetailService";
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import { AccountRole, AccountRoleForRequest, ImportStatus } from "@/utils/enums";
import { UserState } from "@/contexts/redux/features/userSlice";
import { useSelector } from "react-redux";
import { ResponseDTO } from "@/hooks/useApi";
import useAccountService, { AccountResponse } from "@/hooks/useAccountService";
import { LegendItem } from "@/components/commons/LegendItem";
import { usePusherContext } from "@/contexts/pusher/PusherContext";
import dayjs from "dayjs";

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
  const { latestNotification } = usePusherContext();
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [importOrdersData, setImportOrdersData] = useState<ImportOrderData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getAllImportOrdersByImportRequestId,
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

  useEffect(() => {
    if (latestNotification) {
      const isImportOrderEvent = latestNotification.type.includes('import-order');
      
      if (isImportOrderEvent) {
        console.log('Received import-order notification:', latestNotification);
        fetchImportOrders();
        fetchAccountsByRole();
      }
    }
  }, [latestNotification]);

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
        response = await getAllImportOrdersByImportRequestId(
          importRequestId
        );
      } else {
        response = await getAllImportOrders(
          pagination.current || 1,
          pagination.pageSize || 10
        );
      }

      const formatted: ImportOrderData[] = await Promise.all(
        (response.content ?? []).map(async (order) => {
          // "limit = 1000" đủ để ôm hết chi tiết 1 đơn
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

  const isNearReceivingTime = (dateReceived: string, timeReceived: string): boolean => {
    if (!dateReceived || !timeReceived) return false;

    const receivingDateTime = new Date(`${dateReceived}T${timeReceived}`);
    const now = new Date();
    const diffInHours = (receivingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return diffInHours > 0 && diffInHours <= 6;
  };

  const filteredItems = importOrdersData.filter((importOrder) => {
    const matchesSearch = importOrder.importOrderId.toString().includes(searchTerm.toLowerCase()) ||
      importOrder.importRequestId.toString().includes(searchTerm.toLowerCase());
    
    // Filter by assigned staff
    const matchesStaff = selectedStaff.length > 0 ? 
      selectedStaff.includes(importOrder.assignedStaffId?.toString() || '') : true;
    
    // Filter by status
    let matchesStatusFilter = true;
    if (selectedStatusFilter) {
      switch (selectedStatusFilter) {
        case 'near-time':
          matchesStatusFilter = isNearReceivingTime(importOrder.dateReceived, importOrder.timeReceived) &&
                 importOrder.status !== ImportStatus.CANCELLED &&
                 importOrder.status !== ImportStatus.COMPLETED &&
                 importOrder.status !== ImportStatus.COUNTED;
          break;
        case 'in-progress':
          matchesStatusFilter = importOrder.status === ImportStatus.IN_PROGRESS;
          break;
        case 'counted':
          matchesStatusFilter = importOrder.status === ImportStatus.COUNTED;
          break;
        case 'extended':
          matchesStatusFilter = importOrder.status === ImportStatus.EXTENDED;
          break;
        case 'completed':
          matchesStatusFilter = importOrder.status === ImportStatus.COMPLETED;
          break;
        case 'cancelled':
          matchesStatusFilter = importOrder.status === ImportStatus.CANCELLED;
          break;
        default:
          matchesStatusFilter = true;
      }
    }
    
    return matchesSearch && matchesStaff && matchesStatusFilter;
  });

  const getStatusRowClass = (status: ImportStatus): string => {
    switch (status) {
      case ImportStatus.IN_PROGRESS:
        return 'bg-[rgba(59,130,246,0.06)]'; // Blue with opacity
      case ImportStatus.COUNTED:
        return 'bg-[rgba(59,130,246,0.14)]'; // Blue with opacity
      case ImportStatus.EXTENDED:
        return 'bg-[rgba(245,158,11,0.08)]'; // Amber with opacity
      case ImportStatus.COMPLETED:
        return 'bg-[rgba(34,197,94,0.08)]'; // Green with opacity
      case ImportStatus.CANCELLED:
        return 'bg-[rgba(107,114,128,0.12)]'; // Gray with opacity
      default:
        return 'no-bg-row';
    }
  };

  const columns = [
    {
      width: "16%",
      title: "Mã đơn nhập",
      dataIndex: "importOrderId",
      key: "importOrderId",
      render: (id: number) => `#${id}`,
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    // {
    //   width: "10%",
    //   title: "Mã phiếu",
    //   dataIndex: "importRequestId",
    //   key: "importRequestId",
    //   render: (id: number) => `#${id}`,
    //   align: "right" as const,
    //   onHeaderCell: () => ({
    //     style: { textAlign: 'center' as const }
    //   }),
    // },
    {
      title: "Số mặt hàng cần nhập",
      dataIndex: "importOrderDetailsCount",
      key: "importOrderDetailsCount",
      align: "center" as const,
      render: (count: number) => (
        <div className="text-right text-lg">{count}</div>
      ),
    },
    {
      title: "Số mặt hàng đã nhập đủ",
      dataIndex: "importOrderDetailsCompletedCount",
      key: "importOrderDetailsCompletedCount",
      align: "center" as const,
      render: (count: number, record: ImportOrderData) => (
        record.totalActualQuantityInOrder === 0 ? (
          <div className="text-right font-bold text-gray-600">Chưa nhập</div>
        ) : (
          <div className="text-right font-bold">{count}</div>
        )
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
      title: "Thời điểm nhận hàng (dự kiến)",
      key: "receivedDateTime",
      align: "center" as const,
      dataIndex: "dateReceived",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportOrderData, b: ImportOrderData) => {
        // Get the actual date and time to use for sorting
        const getDateTime = (record: ImportOrderData) => {
          const date = record.isExtended ? record.extendedDate : record.dateReceived;
          const time = record.isExtended ? record.extendedTime : record.timeReceived;
          
          if (!date || !time) return null;
          
          // Combine date and time into a single datetime string
          return dayjs(`${date}T${time}`);
        };

        const dateTimeA = getDateTime(a);
        const dateTimeB = getDateTime(b);

        // Handle null values - put them at the end
        if (!dateTimeA && !dateTimeB) return 0;
        if (!dateTimeA) return 1;
        if (!dateTimeB) return -1;

        // Compare datetime objects (early to late)
        return dateTimeA.isBefore(dateTimeB) ? -1 : dateTimeA.isAfter(dateTimeB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo thời điểm nhận hàng'
      },
      render: (_: any, record: ImportOrderData) => {
        if (record.isExtended) {
          return (
            <>
              <div>Ngày <b>{record.extendedDate ? dayjs(record.extendedDate).format("DD-MM-YYYY") : "-"}</b></div>
              <div>Lúc <b>{record.extendedTime ? record.extendedTime.slice(0, 5) : "-"}</b></div>
            </>
          );
        }
        return (
          <>
            <div>Ngày <b>{record.dateReceived ? dayjs(record.dateReceived).format("DD-MM-YYYY") : "-"}</b></div>
            <div>Lúc <b>{record.timeReceived ? record.timeReceived.slice(0, 5) : "-"}</b></div>
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

  const handleStatusFilterClick = (filterKey: string): void => {
    setSelectedStatusFilter(selectedStatusFilter === filterKey ? null : filterKey);
    // Reset về trang đầu khi filter thay đổi
    setPagination(prev => ({ ...prev, current: 1 }));
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
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">
          {importRequestId
            ? `Danh sách đơn nhập - Phiếu nhập #${importRequestId}`
            : 'Danh sách tất cả đơn nhập'}
        </h1>
        <Space size="large">
          <LegendItem
            color="rgba(220, 38, 38, 0.1)"
            borderColor="rgba(220, 38, 38, 0.5)"
            title="Gần đến giờ nhận hàng"
            description="Đơn nhập có thời điểm nhận hàng trong vòng 6 tiếng tới so với bây giờ"
            clickable={true}
            isSelected={selectedStatusFilter === 'near-time'}
            onClick={() => handleStatusFilterClick('near-time')}
          />
          <LegendItem
            color="rgba(59, 130, 246, 0.1)"
            borderColor="rgba(59, 130, 246, 0.5)"
            title="Đang xử lý"
            description="Đơn nhập đang trong quá trình xử lý"
            clickable={true}
            isSelected={selectedStatusFilter === 'in-progress'}
            onClick={() => handleStatusFilterClick('in-progress')}
          />
          <LegendItem
            color="rgba(59, 130, 246, 0.3)"
            borderColor="rgba(59, 130, 246, 0.7)"
            title="Đã kiểm đếm"
            description="Đơn nhập đã kiểm đếm"
            clickable={true}
            isSelected={selectedStatusFilter === 'counted'}
            onClick={() => handleStatusFilterClick('counted')}
          />
          <LegendItem
            color="rgba(245,158,11,0.1)"
            borderColor="rgba(245,158,11,0.5)"
            title="Đã gia hạn"
            description="Đơn nhập đã gia hạn"
            clickable={true}
            isSelected={selectedStatusFilter === 'extended'}
            onClick={() => handleStatusFilterClick('extended')}
          />
          <LegendItem
            color="rgba(34, 197, 94, 0.1)"
            borderColor="rgba(34, 197, 94, 0.5)"
            title="Đã hoàn tất"
            description="Đơn nhập đã hoàn tất"
            clickable={true}
            isSelected={selectedStatusFilter === 'completed'}
            onClick={() => handleStatusFilterClick('completed')}
          />
          <LegendItem
            color="rgba(107, 114, 128, 0.1)"
            borderColor="rgba(107, 114, 128, 0.5)"
            title="Đã hủy"
            description="Đơn nhập đã bị hủy"
            clickable={true}
            isSelected={selectedStatusFilter === 'cancelled'}
            onClick={() => handleStatusFilterClick('cancelled')}
          />
        </Space>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="min-w-[300px]">
          <Input
            placeholder="Tìm kiếm theo mã đơn nhập"
            value={searchTerm}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
          />
        </div>
        <Select
          mode="multiple"
          placeholder="Nhân viên được phân công"
          className="min-w-[300px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
          value={selectedStaff}
          onChange={setSelectedStaff}
          allowClear
          maxTagCount="responsive"
          options={staffs.map(staff => ({ 
            label: staff.fullName, 
            value: staff.id.toString() 
          }))}
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
          rowClassName={(record) => {
            const isNearTime = isNearReceivingTime(record.dateReceived, record.timeReceived);
            const statusClass = getStatusRowClass(record.status);
            
            // Priority: COMPLETED and CANCELLED > near time > other status colors
            if (record.status === ImportStatus.COMPLETED) {
              return `${statusClass} status-green`;
            }
            
            if (record.status === ImportStatus.CANCELLED) {
              return `${statusClass} status-gray`;
            }
            
            if (isNearTime) {
              return 'bg-[rgba(220,38,38,0.05)]';
            }
            
            // Add status-specific class for hover effects
            if (statusClass !== 'no-bg-row') {
              const statusType = record.status === ImportStatus.IN_PROGRESS
                ? 'status-blue'
                : record.status === ImportStatus.COUNTED
                ? 'status-blue-heavy'
                : '';
              return `${statusClass} ${statusType}`;
            }
            
            return 'no-bg-row';
          }}
          className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${importOrdersData.length > 0 ? 
            '[&_.ant-table-tbody_tr:hover_td]:!bg-[rgba(220,38,38,0.08)] [&_.ant-table-tbody_tr.no-bg-row:hover_td]:!bg-gray-100 ' +
            '[&_.ant-table-tbody_tr.status-blue:hover_td]:!bg-[rgba(59,130,246,0.08)] ' +
            '[&_.ant-table-tbody_tr.status-blue-heavy:hover_td]:!bg-[rgba(59,130,246,0.16)] ' +
            '[&_.ant-table-tbody_tr.status-green:hover_td]:!bg-[rgba(34,197,94,0.08)] ' +
            '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)] ' +
            '[&_.ant-table-tbody_tr.status-amber:hover_td]:!bg-[rgba(245,158,11,0.08)]'
            : ''}`}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            total: filteredItems.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            locale: {
              items_per_page: "/ trang"
            },
            showTotal: (total: number) => `Tổng cộng có ${total} đơn nhập${selectedStatusFilter || selectedStaff.length > 0 ? ' (đã lọc)' : ''}`,
          }}
        />
      )}
    </div>
  );
};

export default ImportOrderList; 