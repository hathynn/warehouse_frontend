import React, { useState, useEffect } from "react";
import { Table, Button, Input, Spin, TablePaginationConfig, Tooltip, Space, Select } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { Link, useParams, useNavigate } from "react-router-dom";
import useImportOrderService, {
  ImportOrderResponse,
} from "@/services/useImportOrderService";
import { SearchOutlined, ArrowLeftOutlined, EyeOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import { AccountRole, AccountRoleForRequest, ImportStatus } from "@/utils/enums";
import { UserState } from "@/contexts/redux/features/userSlice";
import { useSelector } from "react-redux";
import { ResponseDTO } from "@/utils/interfaces";
import useAccountService, { AccountResponse } from "@/services/useAccountService";
import { LegendItem } from "@/components/commons/LegendItem";
import { usePusherContext } from "@/contexts/pusher/PusherContext";
import { ImportOrderFilterState, useImportOrderFilter } from "@/hooks/useImportOrderFilter";
import dayjs from "dayjs";
import { legendItems } from "@/constants/legendItems";
import { getStatusRowClass } from "@/utils/helpers";

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
  // ========== ROUTER & PARAMS ==========
  const { importRequestId } = useParams<RouteParams>();
  const navigate = useNavigate();
  const userRole = useSelector((state: { user: UserState }) => state.user.role);

  // ========== PUSHER CONTEXT ==========
  const { latestNotification } = usePusherContext();

  // ========== FILTER CONTEXT ==========
  const { filterState, updateFilter } = useImportOrderFilter();
  const {
    selectedImportRequest,
    searchImportOrderTerm,
    selectedStatusFilter,
    selectedStaff,
    pagination
  } = filterState as ImportOrderFilterState;

  // ========== DATA STATES ==========
  const [staffs, setStaffs] = useState<AccountResponse[]>([]);
  const [importOrdersData, setImportOrdersData] = useState<ImportOrderData[]>([]);

  // ========== SERVICES ==========
  const {
    loading: importOrderLoading,
    getAllImportOrdersByImportRequestId,
    getAllImportOrders
  } = useImportOrderService();

  const {
    loading: accountLoading,
    getAccountsByRole
  } = useAccountService();

  // ========== COMPUTED VALUES ==========
  const loading = importOrderLoading || accountLoading;

  // ========== UTILITY FUNCTIONS ==========
  const isNearReceivingTime = (dateReceived: string, timeReceived: string): boolean => {
    if (!dateReceived || !timeReceived) return false;

    const receivingDateTime = new Date(`${dateReceived}T${timeReceived}`);
    const now = new Date();
    const diffInHours = (receivingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return diffInHours > 0 && diffInHours <= 6;
  };

  // ========== COMPUTED VALUES & FILTERING ==========
  const filteredItems = importOrdersData.filter((importOrder) => {
    const matchesImportRequestSearch = selectedImportRequest.length > 0 ?
      selectedImportRequest.includes(importOrder.importRequestId.toString()) : true;
    const matchesImportOrderSearch = importOrder.importOrderId.toString().toLowerCase().includes(searchImportOrderTerm.toLowerCase());

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
          importOrder.status !== ImportStatus.READY_TO_STORE;
          importOrder.status !== ImportStatus.STORED;
          importOrder.status !== ImportStatus.COUNT_AGAIN_REQUESTED;
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
        case 'ready-to-store':
          matchesStatusFilter = importOrder.status === ImportStatus.READY_TO_STORE;
          break;
        case 'stored':
          matchesStatusFilter = importOrder.status === ImportStatus.STORED;
          break;
        case 'count-again-requested':
          matchesStatusFilter = importOrder.status === ImportStatus.COUNT_AGAIN_REQUESTED;
          break;
        case 'cancelled':
          matchesStatusFilter = importOrder.status === ImportStatus.CANCELLED;
          break;
        default:
          matchesStatusFilter = true;
      }
    }

    return matchesImportRequestSearch && matchesImportOrderSearch && matchesStaff && matchesStatusFilter;
  });

  // ========== USE EFFECTS ==========
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
        fetchImportOrders();
        fetchAccountsByRole();
      }
    }
  }, [latestNotification]);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchAccountsByRole = async (): Promise<void> => {
    const response = await getAccountsByRole(AccountRoleForRequest.STAFF);
    setStaffs(response || []);
  };

  const fetchImportOrders = async (): Promise<void> => {
    let response: ResponseDTO<ImportOrderResponse[]>;

    if (importRequestId) {
      response = await getAllImportOrdersByImportRequestId(
        importRequestId
      );
    } else {
      response = await getAllImportOrders();
    }

    const formatted: ImportOrderData[] = (response.content ?? []).map(order => {
      const importOrderDetails = order.importOrderDetails || [];

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
    });

    setImportOrdersData(formatted);

    if (response && response.metaDataDTO) {
      updateFilter({
        pagination: {
          current: response.metaDataDTO.page,
          pageSize: response.metaDataDTO.limit,
          total: response.metaDataDTO.total,
        }
      });
    }
  };

  // ========== NAVIGATION HANDLERS ==========
  const handleBackButton = (): void => {
    if (importRequestId) {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(importRequestId));
    } else {
      navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
    }
  };

  // ========== EVENT HANDLERS ==========

  const handleImportOrderSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateFilter({ searchImportOrderTerm: e.target.value });
  };

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    updateFilter({
      pagination: {
        ...newPagination,
        current: newPagination.current,
        pageSize: newPagination.pageSize,
      }
    });
  };

  const handleStatusFilterClick = (filterKey: string): void => {
    const newStatusFilter = selectedStatusFilter === filterKey ? null : filterKey;
    updateFilter({
      selectedStatusFilter: newStatusFilter,
      pagination: { ...pagination, current: 1 } // Reset về trang đầu khi filter thay đổi
    });
  };

  // ========== COMPUTED VALUES & RENDER LOGIC ==========
  const columns = [
    {
      width: "16%",
      title: "Mã đơn nhập",
      dataIndex: "importOrderId",
      key: "importOrderId",
      render: (id: number) => `#${id}`,
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "12%",
      title: "Số hàng cần nhập",
      dataIndex: "importOrderDetailsCount",
      key: "importOrderDetailsCount",
      align: "center" as const,
      render: (count: number) => (
        <div className="text-lg text-right">{count}</div>
      ),
    },
    {
      width: "12%",
      title: "Số hàng đã nhập đủ",
      dataIndex: "importOrderDetailsCompletedCount",
      key: "importOrderDetailsCompletedCount",
      align: "center" as const,
      render: (count: number, record: ImportOrderData) => (
        record.totalActualQuantityInOrder === 0 ? (
          <div className="font-bold text-right text-gray-600">Chưa nhập</div>
        ) : (
          <div className="font-bold text-right">{count}</div>
        )
      ),
    },
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
            <span className="inline-flex items-center justify-center text-blue-900 border-2 border-blue-900 rounded-full cursor-pointer hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg" style={{ width: 32, height: 32 }}>
              <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
            </span>
          </Link>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className={`mx-auto`}>
      <div className="flex items-center justify-between mb-3">
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
      <div className="mb-4">
        <h1 className="text-2xl font-bold">
          {importRequestId
            ? `Danh sách đơn nhập - Phiếu nhập #${importRequestId}`
            : 'Danh sách tất cả đơn nhập'}
        </h1>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="min-w-[240px]">
          <Input
            placeholder="Tìm theo mã đơn nhập"
            value={searchImportOrderTerm}
            onChange={handleImportOrderSearchChange}
            prefix={<SearchOutlined />}
            className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
          />
        </div>
        <Select
          mode="multiple"
          allowClear
          placeholder="Tìm theo mã phiếu nhập"
          value={selectedImportRequest}
          onChange={(value) => updateFilter({
            selectedImportRequest: value,
            pagination: { ...pagination, current: 1 }
          })}
          className="min-w-[240px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
          options={
            Array.from(new Set(importOrdersData.map(importOrder => importOrder.importRequestId))).map(importRequestId => ({
              label: importRequestId.toString(),
              value: importRequestId.toString()
            }))
          }
          filterOption={(input, option) =>
            option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          dropdownStyle={{
            maxHeight: '240px',
          }}
          listHeight={160}
        />
        <Select
          mode="multiple"
          placeholder="Tìm theo nhân viên được phân công"
          className="min-w-[300px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
          value={selectedStaff}
          onChange={(value) => updateFilter({ selectedStaff: value })}
          allowClear
          maxTagCount="responsive"
          options={staffs.map(staff => ({
            label: staff.fullName,
            value: staff.id.toString()
          }))}
          filterOption={(input, option) =>
            option?.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
          dropdownStyle={{
            maxHeight: '240px',
          }}
          listHeight={160}
        />
      </div>
      
      <div className="flex justify-end mb-4">
        <Space size="large">
          {legendItems.map((item) => (
            <LegendItem
              key={item.key}
              color={item.color}
              borderColor={item.borderColor}
              title={item.title}
              description={item.description}
              clickable={true}
              isSelected={selectedStatusFilter === item.key}
              onClick={() => handleStatusFilterClick(item.key)}
            />
          ))}
        </Space>
      </div>
      
      <Table
        columns={columns}
        loading={loading}
        dataSource={filteredItems}
        rowKey="importOrderId"
        rowClassName={(record) => {
          const isNearTime = isNearReceivingTime(record.dateReceived, record.timeReceived);
          const statusClass = getStatusRowClass(record.status);

          if (record.status === ImportStatus.STORED) {
            return `${statusClass} status-green-heavy`;
          }

          if (record.status === ImportStatus.READY_TO_STORE) {
            return `${statusClass} status-green-medium`;
          }

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
                : record.status === ImportStatus.COUNT_AGAIN_REQUESTED
                  ? 'status-amber-heavy'
                  : record.status === ImportStatus.EXTENDED
                    ? 'status-amber'
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
          '[&_.ant-table-tbody_tr.status-green-medium:hover_td]:!bg-[rgba(34,197,94,0.12)] ' +
          '[&_.ant-table-tbody_tr.status-green-heavy:hover_td]:!bg-[rgba(34,197,94,0.15)] ' +
          '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-amber:hover_td]:!bg-[rgba(245,158,11,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-amber-heavy:hover_td]:!bg-[rgba(245,158,11,0.15)]'
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
    </div>
  );
};

export default ImportOrderList; 