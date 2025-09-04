import React, { useState, useEffect } from "react";
import { Table, TablePaginationConfig, Tag, Drawer, Timeline, Input, DatePicker, Select } from "antd";
import { ClockCircleOutlined, UserOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, EditOutlined, StopOutlined, UserSwitchOutlined, PlayCircleOutlined, LoadingOutlined, ExclamationCircleOutlined, CloseCircleOutlined, InboxOutlined, AuditOutlined, SafetyOutlined, SyncOutlined } from "@ant-design/icons";
import useTransactionLogService from "@/services/useTransactionLogService";
import useAccountService, { AccountResponse } from "@/services/useAccountService";
import { AccountRoleForRequest } from "@/utils/enums";
import { StockCheckRequestTransactionLog, TransactionLogResponse } from "@/utils/interfaces";
import { StockCheckRequestResponse } from "@/services/useStockCheckService";
import dayjs from "dayjs";
import { FilePlus, WarehouseIcon, CheckSquare } from "lucide-react";

// ========== INTERFACES ==========
interface StockCheckRequestSummary {
  key: string;
  stockCheckId: string;
  createdDate: string;
  executorFullName: string;
  stockCheckReason?: string;
  stockCheckType?: string;
}

interface TransactionDetail {
  id: string;
  type: 'STOCK_CHECK';
  action: string;
  createdDate: string;
  executorFullName: string;
  stockCheckId?: string;
  stockCheckReason?: string;
  stockCheckType?: string;
  startDate?: string;
  expectedCompletedDate?: string;
  countingDate?: string;
  countingTime?: string;
  note?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  status?: string;
}

const StockCheckTransactionHistory: React.FC = () => {
  // ========== DATA STATES ==========
  const [stockCheckRequestSummaries, setStockCheckRequestSummaries] = useState<StockCheckRequestSummary[]>([]);
  const [allTransactionLogs, setAllTransactionLogs] = useState<TransactionLogResponse[]>([]);
  const [staffList, setStaffList] = useState<AccountResponse[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ========== FILTER STATES ==========
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string[]>([]);

  // ========== DRAWER STATES ==========
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStockCheckId, setSelectedStockCheckId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetail[]>([]);

  // ========== SERVICES ==========
  const { loading: transactionLoading, getAllTransactionLogs } = useTransactionLogService();
  const { loading: accountLoading, getAccountsByRole } = useAccountService();

  const loading = transactionLoading || accountLoading;

  // ========== UTILITY FUNCTIONS ==========
  const getStaffNameById = (staffId: number): string => {
    const staff = staffList.find(s => s.id === staffId);
    return staff ? staff.fullName : `Nhân viên ID: ${staffId}`;
  };

  const getActionColor = (action: string, status?: string): string => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'ASSIGN_STAFF':
        return 'blue';
      case 'CONFIRM_COUNTED':
        return 'green';
      case 'UPDATE_STATUS':
        return status ? getStatusColor(status) : 'orange';
      case 'COMPLETE':
        return 'green';
      default:
        return 'default';
    }
  };

  const getActionIconColor = (action: string, status?: string): string => {
    switch (action) {
      case 'CREATE':
        return '#6B7280'; // gray-500
      case 'ASSIGN_STAFF':
        return '#3B82F6'; // blue-500
      case 'CONFIRM_COUNTED':
        return '#10B981'; // green-500
      case 'UPDATE_STATUS':
        return status ? getStatusIconColor(status) : '#F97316'; // status-based or orange-500
      case 'COMPLETE':
        return '#10B981'; // green-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getActionIcon = (action: string, status?: string) => {
    const iconProps = {
      style: { fontSize: '20px', color: getActionIconColor(action, status) }
    };

    switch (action) {
      case 'CREATE':
        return <FilePlus {...iconProps} />;
      case 'ASSIGN_STAFF':
        return <UserSwitchOutlined {...iconProps} />;
      case 'CONFIRM_COUNTED':
        return <SafetyOutlined {...iconProps} />;
      case 'UPDATE_STATUS':
        return status ? getStatusIcon(status) : <EditOutlined {...iconProps} />;
      case 'COMPLETE':
        return <CheckCircleOutlined {...iconProps} />;
      default:
        return <ClockCircleOutlined {...iconProps} />;
    }
  };

  const getActionText = (action: string, status?: string): string => {
    switch (action) {
      case 'CREATE':
        return 'Tạo mới';
      case 'ASSIGN_STAFF':
        return 'Phân công nhân viên';
      case 'CONFIRM_COUNTED':
        return 'Xác nhận kiểm đếm';
      case 'UPDATE_STATUS':
        return status ? getStatusText(status) : 'Cập nhật trạng thái';
      case 'COMPLETE':
        return 'Hoàn thành';
      default:
        return action;
    }
  };

  const getStockCheckTypeText = (stockCheckType: string): string => {
    switch (stockCheckType) {
      case 'SPOT_CHECK':
        return 'Kiểm đột xuất';
      case 'PERIODIC':
        return 'Kiểm định kỳ';
      default:
        return stockCheckType;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PENDING':
        return 'Chờ xử lý';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'processing';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PENDING':
        return 'default';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIconColor = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return '#1890FF'; // blue-500 (processing)
      case 'COMPLETED':
        return '#52C41A'; // green-500
      case 'CANCELLED':
        return '#FF4D4F'; // red-500
      case 'PENDING':
        return '#6B7280'; // gray-500
      case 'APPROVED':
        return '#10B981'; // emerald-500
      case 'REJECTED':
        return '#FF4D4F'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = {
      style: { fontSize: '20px', color: getStatusIconColor(status) }
    };

    switch (status) {
      case 'IN_PROGRESS':
        return <PlayCircleOutlined {...iconProps} />;
      case 'COMPLETED':
        return <CheckCircleOutlined {...iconProps} />;
      case 'CANCELLED':
        return <CloseCircleOutlined {...iconProps} />;
      case 'PENDING':
        return <ClockCircleOutlined {...iconProps} />;
      case 'APPROVED':
        return <InboxOutlined {...iconProps} />;
      case 'REJECTED':
        return <ExclamationCircleOutlined {...iconProps} />;
      default:
        return <SyncOutlined {...iconProps} />;
    }
  };

  // ========== COMPUTED VALUES & FILTERING ==========
  const filteredItems = stockCheckRequestSummaries.filter((item) => {
    const matchesSearch = item.stockCheckId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? selectedDate.format('YYYY-MM-DD') === item.createdDate?.split('T')[0] : true;
    const matchesCreator = selectedCreator.length > 0 ? selectedCreator.includes(item.executorFullName) : true;

    return matchesSearch && matchesDate && matchesCreator;
  });

  // Get unique creators from data
  const uniqueCreators = Array.from(new Set(stockCheckRequestSummaries.map(item => item.executorFullName))).filter(Boolean);

  // ========== USE EFFECTS ==========
  useEffect(() => {
    fetchTransactionLogs();
    fetchStaffList();
  }, []);

  // Update pagination total when filtered items change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredItems.length,
      current: 1 // Reset to first page when filter changes
    }));
  }, [filteredItems.length]);

  // ========== DATA FETCHING FUNCTIONS ==========
  const fetchStaffList = async (): Promise<void> => {
    try {
      const response = await getAccountsByRole(AccountRoleForRequest.STAFF);
      setStaffList(response || []);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    }
  };

  const fetchTransactionLogs = async (): Promise<void> => {
    try {
      const response = await getAllTransactionLogs();
      const allLogs = response.content as TransactionLogResponse[];
      setAllTransactionLogs(allLogs);

      // Extract unique stock check requests with their creation info
      const stockCheckRequestMap = new Map<string, StockCheckRequestSummary>();

      allLogs.forEach((log) => {
        if (log.type === 'STOCK_CHECK') {
          const stockCheckRequestLog = log as StockCheckRequestTransactionLog;

          if (Array.isArray(stockCheckRequestLog.responseContent)) {
            stockCheckRequestLog.responseContent.forEach((stockCheckRequest: StockCheckRequestResponse) => {
              if (!stockCheckRequestMap.has(stockCheckRequest.id)) {
                stockCheckRequestMap.set(stockCheckRequest.id, {
                  key: stockCheckRequest.id,
                  stockCheckId: stockCheckRequest.id,
                  createdDate: log.createdDate,
                  executorFullName: log.executorFullName,
                  stockCheckReason: stockCheckRequest.stockCheckReason,
                  stockCheckType: stockCheckRequest.type,
                });
              }
            });
          } else if (stockCheckRequestLog.responseContent) {
            const stockCheckRequest = stockCheckRequestLog.responseContent as StockCheckRequestResponse;
            if (!stockCheckRequestMap.has(stockCheckRequest.id)) {
              stockCheckRequestMap.set(stockCheckRequest.id, {
                key: stockCheckRequest.id,
                stockCheckId: stockCheckRequest.id,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                stockCheckReason: stockCheckRequest.stockCheckReason,
                stockCheckType: stockCheckRequest.type,
              });
            }
          }
        }
      });

      const summaries = Array.from(stockCheckRequestMap.values()).sort((a, b) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
      });

      setStockCheckRequestSummaries(summaries);
      setPagination(prev => ({
        ...prev,
        total: summaries.length
      }));
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
    }
  };

  // ========== EVENT HANDLERS ==========
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (date: dayjs.Dayjs | null): void => {
    setSelectedDate(date);
  };

  const handleCreatorChange = (value: string[]): void => {
    setSelectedCreator(value);
  };

  const handleTableChange = (newPagination: TablePaginationConfig): void => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleViewDetails = (stockCheckId: string): void => {
    setSelectedStockCheckId(stockCheckId);

    // Get all transactions related to this stock check request
    const relatedTransactionDetails: TransactionDetail[] = [];

    allTransactionLogs.forEach((log) => {
      if (log.type === 'STOCK_CHECK') {
        const stockCheckRequestLog = log as StockCheckRequestTransactionLog;

        if (Array.isArray(stockCheckRequestLog.responseContent)) {
          stockCheckRequestLog.responseContent.forEach((stockCheckRequest: StockCheckRequestResponse) => {
            if (stockCheckRequest.id === stockCheckId) {
              relatedTransactionDetails.push({
                id: log.id.toString(),
                type: 'STOCK_CHECK',
                action: log.action,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                stockCheckId: stockCheckRequest.id,
                stockCheckReason: stockCheckRequest.stockCheckReason,
                stockCheckType: stockCheckRequest.type,
                startDate: stockCheckRequest.startDate ? dayjs(stockCheckRequest.startDate).format('DD-MM-YYYY') : undefined,
                expectedCompletedDate: stockCheckRequest.expectedCompletedDate ? dayjs(stockCheckRequest.expectedCompletedDate).format('DD-MM-YYYY') : undefined,
                countingDate: stockCheckRequest.countingDate ? dayjs(stockCheckRequest.countingDate).format('DD-MM-YYYY') : undefined,
                countingTime: stockCheckRequest.countingTime,
                note: stockCheckRequest.note,
                assignedStaffId: stockCheckRequest.assignedWareHouseKeeperId,
                assignedStaffName: stockCheckRequest.assignedWareHouseKeeperId ? getStaffNameById(stockCheckRequest.assignedWareHouseKeeperId) : undefined,
                status: stockCheckRequest.status,
              });
            }
          });
        } else if (stockCheckRequestLog.responseContent) {
          const stockCheckRequest = stockCheckRequestLog.responseContent as StockCheckRequestResponse;
          if (stockCheckRequest.id === stockCheckId) {
            relatedTransactionDetails.push({
              id: log.id.toString(),
              type: 'STOCK_CHECK',
              action: log.action,
              createdDate: log.createdDate,
              executorFullName: log.executorFullName,
              stockCheckId: stockCheckRequest.id,
              stockCheckReason: stockCheckRequest.stockCheckReason,
              stockCheckType: stockCheckRequest.type,
              startDate: stockCheckRequest.startDate ? dayjs(stockCheckRequest.startDate).format('DD-MM-YYYY') : undefined,
              expectedCompletedDate: stockCheckRequest.expectedCompletedDate ? dayjs(stockCheckRequest.expectedCompletedDate).format('DD-MM-YYYY') : undefined,
              countingDate: stockCheckRequest.countingDate ? dayjs(stockCheckRequest.countingDate).format('DD-MM-YYYY') : undefined,
              countingTime: stockCheckRequest.countingTime,
              note: stockCheckRequest.note,
              assignedStaffId: stockCheckRequest.assignedWareHouseKeeperId,
              assignedStaffName: stockCheckRequest.assignedWareHouseKeeperId ? getStaffNameById(stockCheckRequest.assignedWareHouseKeeperId) : undefined,
              status: stockCheckRequest.status,
            });
          }
        }
      }
    });

    // Sort by creation date
    relatedTransactionDetails.sort((a, b) => {
      const dateA = dayjs(a.createdDate);
      const dateB = dayjs(b.createdDate);
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
    });

    setTransactionDetails(relatedTransactionDetails);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = (): void => {
    setDrawerOpen(false);
    setSelectedStockCheckId(null);
    setTransactionDetails([]);
  };

  // ========== COLUMNS DEFINITION ==========
  const columns = [
    {
      title: "Mã phiếu kiểm kê",
      dataIndex: "stockCheckId",
      key: "stockCheckId",
      width: "20%",
      align: "center" as const,
      render: (stockCheckId: string) => (
        <div>
          <span className="text-base text-left">#{stockCheckId}</span>
        </div>
      ),
    },
    {
      title: "Ngày giờ tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      width: "15%",
      align: "center" as const,
      sorter: (a: StockCheckRequestSummary, b: StockCheckRequestSummary) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      render: (createdDate: string) => (
        <div className="text-center">
          <div className="font-medium text-sm">
            {dayjs(createdDate).format("DD-MM-YYYY")}
          </div>
          <div className="text-sm text-gray-500">
            {dayjs(createdDate).format("HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Người tạo",
      dataIndex: "executorFullName",
      key: "executorFullName",
      width: "20%",
      align: "center" as const,
      render: (executorFullName: string) => (
        <div className="flex items-center justify-center gap-2">
          <UserOutlined className="text-blue-600" style={{ fontSize: 20 }} />
          <span className="font-medium text-base">{executorFullName}</span>
        </div>
      ),
    },
    {
      title: "Loại kiểm kê",
      dataIndex: "stockCheckType",
      key: "stockCheckType",
      width: "20%",
      align: "center" as const,
      render: (stockCheckType: string) => (
        stockCheckType ? (
          <span className="text-base text-left">{getStockCheckTypeText(stockCheckType)}</span>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      title: "Lý do kiểm kê",
      dataIndex: "stockCheckReason",
      key: "stockCheckReason",
      width: "15%",
      align: "center" as const,
      render: (stockCheckReason: string) => (
        stockCheckReason ? (
          <div className="text-sm text-left truncate" title={stockCheckReason}>
            {stockCheckReason.length > 30 ? stockCheckReason.substring(0, 30) + '...' : stockCheckReason}
          </div>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      title: "Chi tiết",
      key: "actions",
      width: "10%",
      align: "center" as const,
      render: (_: unknown, record: StockCheckRequestSummary) => (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer transition-all duration-200"
            style={{ width: 36, height: 36 }}
            onClick={() => handleViewDetails(record.stockCheckId)}
            title="Xem chi tiết tất cả thao tác"
          >
            <EyeOutlined style={{ fontSize: 20 }} />
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto TransactionHistory">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lịch sử của phiếu kiểm kê</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockCircleOutlined />
          <span>Cập nhật: {dayjs().format("DD-MM-YYYY HH:mm")}</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="min-w-[300px]">
            <Input
              placeholder="Tìm theo mã phiếu kiểm kê"
              value={searchTerm}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
              className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
            />
          </div>

          <DatePicker
            placeholder="Tìm theo ngày tạo"
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            className="min-w-[160px] !border-gray-400 [&_input::placeholder]:!text-gray-400"
            allowClear
          />

          <Select
            mode="multiple"
            placeholder="Tìm theo tên người tạo"
            className="min-w-[240px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
            value={selectedCreator}
            onChange={handleCreatorChange}
            allowClear
            maxTagCount="responsive"
            options={uniqueCreators.map(creator => ({ label: creator, value: creator }))}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div>
              <div className="text-sm text-blue-600">
                Nhấn vào nút <EyeOutlined /> để xem chi tiết lịch sử liên quan đến phiếu kiểm kê.
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="key"
        loading={loading}
        onChange={handleTableChange}
        className="[&_.ant-table-cell]:!p-4 [&_.ant-table-thead_th]:!bg-gray-50 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-tbody_tr:hover_td]:!bg-blue-50"
        pagination={{
          ...pagination,
          total: filteredItems.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu kiểm kê${(searchTerm || selectedDate || selectedCreator.length > 0) ? ' (đã lọc)' : ''}`,
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={`Chi tiết lịch sử - Phiếu kiểm kê #${selectedStockCheckId}`}
        placement="right"
        width={800}
        onClose={handleCloseDrawer}
        open={drawerOpen}
        className="[&_.ant-drawer-header]:!bg-blue-50 [&_.ant-drawer-title]:!text-blue-800 [&_.ant-drawer-title]:!font-bold [&_.ant-drawer-title]:!text-lg"
      >
        {transactionDetails.length > 0 && (
          <div className="m-4">
            <style>
              {`
                .timeline-vertical-center .ant-timeline-item-head {
                  top: 60px !important;
                }
                .timeline-vertical-center .ant-timeline-item-tail {
                  top: 72px !important;
                }
              `}
            </style>
            <Timeline
              mode="left"
              className="timeline-vertical-center"
              items={transactionDetails.map((detail, index) => ({
                dot: (
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: getActionIconColor(detail.action, detail.status)
                      }}
                    >
                      {getActionIcon(detail.action, detail.status)}
                    </div>
                    <div className="mt-2 text-center text-sm text-gray-600">
                      <div className="font-medium">
                        {dayjs(detail.createdDate).format("DD/MM")}
                      </div>
                      <div className="text-gray-500">
                        {dayjs(detail.createdDate).format("HH:mm")}
                      </div>
                    </div>
                  </div>
                ),
                children: (
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition-all duration-200 ml-4">
                    {/* Header without time */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                      <Tag
                        color='purple-inverse'
                        className="!text-sm !px-3 !py-1 !font-medium"
                      >
                        PHIẾU KIỂM KÊ
                      </Tag>
                      <span className="text-sm font-bold text-gray-800">
                        <span className="text-purple-600">#{detail.stockCheckId}</span>
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      {/* Người thực hiện và hành động */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <UserOutlined className="!text-blue-800" />
                          <span className="text-base font-medium text-blue-800">{detail.executorFullName}</span>
                        </div>
                        <div className="w-px h-5 bg-gray-300"></div>
                        <Tag color={getActionColor(detail.action, detail.status)} className="!text-sm !p-1 !font-medium !m-0">
                          {getActionText(detail.action, detail.status)}
                        </Tag>
                      </div>

                      {/* Thông tin nhân viên được phân công */}
                      {detail.action === 'ASSIGN_STAFF' && detail.assignedStaffName && (
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-gray-600 min-w-fit">NV kiểm kê:</span>
                          <span className="text-sm text-blue-600">{detail.assignedStaffName}</span>
                        </div>
                      )}

                      {/* Chi tiết theo hành động */}
                      <div className="space-y-2 bg-purple-50 p-3 rounded-lg">
                        {detail.stockCheckReason && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Lý do:</span>
                            <span className="text-sm text-gray-800">{detail.stockCheckReason}</span>
                          </div>
                        )}
                        {detail.stockCheckType && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Loại kiểm kê:</span>
                            <span className="text-sm text-purple-600">{getStockCheckTypeText(detail.stockCheckType)}</span>
                          </div>
                        )}
                        {detail.startDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày bắt đầu:</span>
                            <span className="text-sm text-gray-800">{detail.startDate}</span>
                          </div>
                        )}
                        {detail.expectedCompletedDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày dự kiến hoàn thành:</span>
                            <span className="text-sm text-gray-800">{detail.expectedCompletedDate}</span>
                          </div>
                        )}
                        {detail.countingDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày kiểm đếm:</span>
                            <span className="text-sm text-gray-800">{detail.countingDate}</span>
                          </div>
                        )}
                        {detail.countingTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Giờ kiểm đếm:</span>
                            <span className="text-sm text-gray-800">{detail.countingTime}</span>
                          </div>
                        )}
                        {detail.note && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Ghi chú:</span>
                            <span className="text-sm text-gray-800">{detail.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default StockCheckTransactionHistory;