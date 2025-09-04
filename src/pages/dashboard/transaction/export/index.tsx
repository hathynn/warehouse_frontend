import React, { useState, useEffect } from "react";
import { Table, TablePaginationConfig, Tag, Drawer, Timeline, Input, DatePicker, Select } from "antd";
import { ClockCircleOutlined, UserOutlined, EyeOutlined, SearchOutlined, CheckCircleOutlined, PlusCircleOutlined, EditOutlined, StopOutlined, UserSwitchOutlined, RedoOutlined, SyncOutlined, PlayCircleOutlined, LoadingOutlined, ExclamationCircleOutlined, CloseCircleOutlined, InboxOutlined, AuditOutlined, SafetyOutlined } from "@ant-design/icons";
import useTransactionLogService from "@/services/useTransactionLogService";
import useAccountService, { AccountResponse } from "@/services/useAccountService";
import { AccountRoleForRequest } from "@/utils/enums";
import { ExportRequestTransactionLog, TransactionLogResponse } from "@/utils/interfaces";
import { ExportRequestResponse } from "@/services/useExportRequestService";
import dayjs from "dayjs";
import { FilePlus, WarehouseIcon } from "lucide-react";

// ========== INTERFACES ==========
interface ExportRequestSummary {
  key: string;
  exportRequestId: string;
  createdDate: string;
  executorFullName: string;
  exportReason?: string;
  exportType?: string;
}

interface TransactionDetail {
  id: string;
  type: 'EXPORT_REQUEST';
  action: string;
  createdDate: string;
  executorFullName: string;
  exportRequestId?: string;
  exportReason?: string;
  exportType?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  countingDate?: string;
  exportDate?: string;
  extendedDate?: string;
  extendedReason?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  countingStaffId?: number;
  countingStaffName?: string;
  status?: string;
}

const ExportTransactionHistory: React.FC = () => {
  // ========== DATA STATES ==========
  const [exportRequestSummaries, setExportRequestSummaries] = useState<ExportRequestSummary[]>([]);
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
  const [selectedExportRequestId, setSelectedExportRequestId] = useState<string | null>(null);
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
      case 'ASSIGN_COUNTING_STAFF':
        return 'blue';
      case 'EXTEND':
      case 'UPDATE_DATE_TIME':
      case 'RENEW':
        return 'orange';
      case 'COMPLETE':
      case 'CONFIRM_COUNTED':
        return 'green';
      case 'UPDATE_STATUS':
        return status ? getStatusColor(status) : 'cyan';
      case 'UPDATE_DEPARTMENT':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getActionIconColor = (action: string, status?: string): string => {
    switch (action) {
      case 'CREATE':
        return '#6B7280'; // gray-500
      case 'ASSIGN_STAFF':
      case 'ASSIGN_COUNTING_STAFF':
        return '#3B82F6'; // blue-500
      case 'EXTEND':
      case 'UPDATE_DATE_TIME':
      case 'RENEW':
        return '#F97316'; // orange-500
      case 'COMPLETE':
      case 'CONFIRM_COUNTED':
        return '#10B981'; // green-500
      case 'UPDATE_STATUS':
        return status ? getStatusIconColor(status) : '#06B6D4'; // status-based or cyan-500
      case 'UPDATE_DEPARTMENT':
        return '#8B5CF6'; // purple-500
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
      case 'ASSIGN_COUNTING_STAFF':
        return <UserSwitchOutlined {...iconProps} />;
      case 'EXTEND':
      case 'UPDATE_DATE_TIME':
        return <EditOutlined {...iconProps} />;
      case 'RENEW':
        return <RedoOutlined {...iconProps} />;
      case 'COMPLETE':
      case 'CONFIRM_COUNTED':
        return <SafetyOutlined {...iconProps} />;
      case 'UPDATE_STATUS':
        return status ? getStatusIcon(status) : <SyncOutlined {...iconProps} />;
      case 'UPDATE_DEPARTMENT':
        return <WarehouseIcon {...iconProps} />;
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
      case 'ASSIGN_COUNTING_STAFF':
        return 'Phân công nhân viên kiểm đếm';
      case 'EXTEND':
        return 'Gia hạn';
      case 'UPDATE_DATE_TIME':
        return 'Cập nhật ngày giờ';
      case 'RENEW':
        return 'Gia hạn mới';
      case 'COMPLETE':
        return 'Hoàn thành';
      case 'CONFIRM_COUNTED':
        return 'Xác nhận kiểm đếm';
      case 'UPDATE_STATUS':
        return status ? getStatusText(status) : 'Cập nhật trạng thái';
      case 'UPDATE_DEPARTMENT':
        return 'Cập nhật phòng ban';
      default:
        return action;
    }
  };

  const getExportTypeText = (exportType: string): string => {
    switch (exportType) {
      case 'SELLING':
        return 'Xuất bán';
      case 'LIQUIDATION':
        return 'Xuất thanh lý';
      case 'INTERNAL':
        return 'Xuất sản xuất';
      case 'RETURN':
        return 'Xuất trả';
      default:
        return exportType;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Chưa bắt đầu';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'COUNTED':
        return 'Đã kiểm đếm';
      case 'WAITING_EXPORT':
        return 'Chờ xuất kho';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'STORED':
        return 'Đã lưu kho';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED':
        return 'default';
      case 'IN_PROGRESS':
        return 'processing';
      case 'COUNTED':
        return 'orange';
      case 'WAITING_EXPORT':
        return 'blue';
      case 'COMPLETED':
        return 'success';
      case 'STORED':
        return 'green';
      case 'CANCELLED':
        return 'error';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIconColor = (status: string): string => {
    switch (status) {
      case 'NOT_STARTED':
        return '#6B7280'; // gray-500
      case 'IN_PROGRESS':
        return '#1890FF'; // blue-500 (processing)
      case 'COUNTED':
        return '#FA8C16'; // orange-500
      case 'WAITING_EXPORT':
        return '#13C2C2'; // cyan-500
      case 'COMPLETED':
        return '#52C41A'; // green-500
      case 'STORED':
        return '#10B981'; // emerald-500
      case 'CANCELLED':
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
      case 'NOT_STARTED':
        return <ClockCircleOutlined {...iconProps} />;
      case 'IN_PROGRESS':
        return <PlayCircleOutlined {...iconProps} />;
      case 'COUNTED':
        return <AuditOutlined {...iconProps} />;
      case 'WAITING_EXPORT':
        return <LoadingOutlined {...iconProps} />;
      case 'COMPLETED':
        return <CheckCircleOutlined {...iconProps} />;
      case 'STORED':
        return <InboxOutlined {...iconProps} />;
      case 'CANCELLED':
        return <CloseCircleOutlined {...iconProps} />;
      case 'REJECTED':
        return <ExclamationCircleOutlined {...iconProps} />;
      default:
        return <SyncOutlined {...iconProps} />;
    }
  };

  // ========== COMPUTED VALUES & FILTERING ==========
  const filteredItems = exportRequestSummaries.filter((item) => {
    const matchesSearch = item.exportRequestId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? selectedDate.format('YYYY-MM-DD') === item.createdDate?.split('T')[0] : true;
    const matchesCreator = selectedCreator.length > 0 ? selectedCreator.includes(item.executorFullName) : true;

    return matchesSearch && matchesDate && matchesCreator;
  });

  // Get unique creators from data
  const uniqueCreators = Array.from(new Set(exportRequestSummaries.map(item => item.executorFullName))).filter(Boolean);

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

      // Extract unique export requests with their creation info
      const exportRequestMap = new Map<string, ExportRequestSummary>();

      allLogs.forEach((log) => {
        if (log.type === 'EXPORT_REQUEST') {
          const exportRequestLog = log as ExportRequestTransactionLog;

          if (Array.isArray(exportRequestLog.responseContent)) {
            exportRequestLog.responseContent.forEach((exportRequest: ExportRequestResponse) => {
              if (!exportRequestMap.has(exportRequest.exportRequestId)) {
                exportRequestMap.set(exportRequest.exportRequestId, {
                  key: exportRequest.exportRequestId,
                  exportRequestId: exportRequest.exportRequestId,
                  createdDate: log.createdDate,
                  executorFullName: log.executorFullName,
                  exportReason: exportRequest.exportReason,
                  exportType: exportRequest.type,
                });
              }
            });
          } else if (exportRequestLog.responseContent) {
            const exportRequest = exportRequestLog.responseContent as ExportRequestResponse;
            if (!exportRequestMap.has(exportRequest.exportRequestId)) {
              exportRequestMap.set(exportRequest.exportRequestId, {
                key: exportRequest.exportRequestId,
                exportRequestId: exportRequest.exportRequestId,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                exportReason: exportRequest.exportReason,
                exportType: exportRequest.type,
              });
            }
          }
        }
      });

      const summaries = Array.from(exportRequestMap.values()).sort((a, b) => {
        const dateA = dayjs(a.createdDate);
        const dateB = dayjs(b.createdDate);
        return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
      });

      setExportRequestSummaries(summaries);
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

  const handleViewDetails = (exportRequestId: string): void => {
    setSelectedExportRequestId(exportRequestId);

    // Get all transactions related to this export request
    const relatedTransactionDetails: TransactionDetail[] = [];

    allTransactionLogs.forEach((log) => {
      if (log.type === 'EXPORT_REQUEST') {
        const exportRequestLog = log as ExportRequestTransactionLog;

        if (Array.isArray(exportRequestLog.responseContent)) {
          exportRequestLog.responseContent.forEach((exportRequest: ExportRequestResponse) => {
            if (exportRequest.exportRequestId === exportRequestId) {
              relatedTransactionDetails.push({
                id: log.id.toString(),
                type: 'EXPORT_REQUEST',
                action: log.action,
                createdDate: log.createdDate,
                executorFullName: log.executorFullName,
                exportRequestId: exportRequest.exportRequestId,
                exportReason: exportRequest.exportReason,
                exportType: exportRequest.type,
                receiverName: exportRequest.receiverName,
                receiverPhone: exportRequest.receiverPhone,
                receiverAddress: exportRequest.receiverAddress,
                countingDate: exportRequest.countingDate ? dayjs(exportRequest.countingDate).format('DD-MM-YYYY') : undefined,
                exportDate: exportRequest.exportDate ? dayjs(exportRequest.exportDate).format('DD-MM-YYYY') : undefined,
                extendedDate: exportRequest.extendedDate ? dayjs(exportRequest.extendedDate).format('DD-MM-YYYY') : undefined,
                extendedReason: exportRequest.extendedReason,
                assignedStaffId: exportRequest.assignedWarehouseKeeperId,
                assignedStaffName: exportRequest.assignedWarehouseKeeperId ? getStaffNameById(exportRequest.assignedWarehouseKeeperId) : undefined,
                countingStaffId: exportRequest.countingStaffId,
                countingStaffName: exportRequest.countingStaffId ? getStaffNameById(exportRequest.countingStaffId) : undefined,
                status: exportRequest.status,
              });
            }
          });
        } else if (exportRequestLog.responseContent) {
          const exportRequest = exportRequestLog.responseContent as ExportRequestResponse;
          if (exportRequest.exportRequestId === exportRequestId) {
            relatedTransactionDetails.push({
              id: log.id.toString(),
              type: 'EXPORT_REQUEST',
              action: log.action,
              createdDate: log.createdDate,
              executorFullName: log.executorFullName,
              exportRequestId: exportRequest.exportRequestId,
              exportReason: exportRequest.exportReason,
              exportType: exportRequest.type,
              receiverName: exportRequest.receiverName,
              receiverPhone: exportRequest.receiverPhone,
              receiverAddress: exportRequest.receiverAddress,
              countingDate: exportRequest.countingDate ? dayjs(exportRequest.countingDate).format('DD-MM-YYYY') : undefined,
              exportDate: exportRequest.exportDate ? dayjs(exportRequest.exportDate).format('DD-MM-YYYY') : undefined,
              extendedDate: exportRequest.extendedDate ? dayjs(exportRequest.extendedDate).format('DD-MM-YYYY') : undefined,
              extendedReason: exportRequest.extendedReason,
              assignedStaffId: exportRequest.assignedWarehouseKeeperId,
              assignedStaffName: exportRequest.assignedWarehouseKeeperId ? getStaffNameById(exportRequest.assignedWarehouseKeeperId) : undefined,
              countingStaffId: exportRequest.countingStaffId,
              countingStaffName: exportRequest.countingStaffId ? getStaffNameById(exportRequest.countingStaffId) : undefined,
              status: exportRequest.status,
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
    setSelectedExportRequestId(null);
    setTransactionDetails([]);
  };

  // ========== COLUMNS DEFINITION ==========
  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "exportRequestId",
      key: "exportRequestId",
      width: "20%",
      align: "center" as const,
      render: (exportRequestId: string) => (
        <div>
          <span className="text-base text-left">#{exportRequestId}</span>
        </div>
      ),
    },
    {
      title: "Ngày giờ tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      width: "15%",
      align: "center" as const,
      sorter: (a: ExportRequestSummary, b: ExportRequestSummary) => {
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
      title: "Loại xuất",
      dataIndex: "exportType",
      key: "exportType",
      width: "20%",
      align: "center" as const,
      render: (exportType: string) => (
        exportType ? (
          <span className="text-base text-left">{getExportTypeText(exportType)}</span>
        ) : (
          <span className="text-gray-500">-</span>
        )
      ),
    },
    {
      title: "Lời do xuất",
      dataIndex: "exportReason",
      key: "exportReason",
      width: "15%",
      align: "center" as const,
      render: (exportReason: string) => (
        exportReason ? (
          <div className="text-sm text-left truncate" title={exportReason}>
            {exportReason.length > 30 ? exportReason.substring(0, 30) + '...' : exportReason}
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
      render: (_: unknown, record: ExportRequestSummary) => (
        <div className="flex justify-center">
          <span
            className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer transition-all duration-200"
            style={{ width: 36, height: 36 }}
            onClick={() => handleViewDetails(record.exportRequestId)}
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
        <h1 className="text-2xl font-bold">Lịch sử của phiếu xuất</h1>
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
              placeholder="Tìm theo mã phiếu xuất"
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
                Nhấn vào nút <EyeOutlined /> để xem chi tiết lịch sử liên quan đến phiếu xuất.
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
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu xuất${(searchTerm || selectedDate || selectedCreator.length > 0) ? ' (tại thời điểm)' : ''}`,
        }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={`Chi tiết lịch sử - Phiếu xuất #${selectedExportRequestId}`}
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
                        color='orange-inverse'
                        className="!text-sm !px-3 !py-1 !font-medium"
                      >
                        PHIẾU XUẤT
                      </Tag>
                      <span className="text-sm font-bold text-gray-800">
                        <span className="text-orange-600">#{detail.exportRequestId}</span>
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
                      {(detail.action === 'ASSIGN_STAFF' || detail.action === 'ASSIGN_COUNTING_STAFF') && (
                        <>
                          {detail.assignedStaffName && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-fit">
                                {detail.action === 'ASSIGN_STAFF' ? 'NV xác nhận:' : 'NV kiểm đếm:'}
                              </span>
                              <span className="text-sm text-blue-600">{detail.assignedStaffName}</span>
                            </div>
                          )}
                          {detail.countingStaffName && detail.action === 'ASSIGN_COUNTING_STAFF' && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 min-w-fit">NV kiểm đếm:</span>
                              <span className="text-sm text-blue-600">{detail.countingStaffName}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Chi tiết theo hành động */}
                      <div className="space-y-2 bg-orange-50 p-3 rounded-lg">
                        {detail.exportReason && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Lời do:</span>
                            <span className="text-sm text-gray-800">{detail.exportReason}</span>
                          </div>
                        )}
                        {detail.exportType && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Loại xuất:</span>
                            <span className="text-sm text-orange-600">{getExportTypeText(detail.exportType)}</span>
                          </div>
                        )}
                        {detail.receiverName && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Người nhận:</span>
                            <span className="text-sm text-gray-800">{detail.receiverName}</span>
                          </div>
                        )}
                        {detail.receiverPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Số điện thoại:</span>
                            <span className="text-sm text-gray-800">{detail.receiverPhone}</span>
                          </div>
                        )}
                        {detail.receiverAddress && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Địa chỉ:</span>
                            <span className="text-sm text-gray-800">{detail.receiverAddress}</span>
                          </div>
                        )}
                        {detail.countingDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày kiểm định:</span>
                            <span className="text-sm text-gray-800">{detail.countingDate}</span>
                          </div>
                        )}
                        {detail.exportDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày xuất:</span>
                            <span className="text-sm text-gray-800">{detail.exportDate}</span>
                          </div>
                        )}
                        {detail.extendedDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Ngày gia hạn:</span>
                            <span className="text-sm text-gray-800">{detail.extendedDate}</span>
                          </div>
                        )}
                        {detail.extendedReason && (
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 min-w-fit">Lý do gia hạn:</span>
                            <span className="text-sm text-gray-800">{detail.extendedReason}</span>
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

export default ExportTransactionHistory;