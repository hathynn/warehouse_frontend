import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tabs, Tooltip, TablePaginationConfig, Space } from "antd";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { SearchOutlined, PlusOutlined, EyeOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import useExportRequestService, { ExportRequestResponse } from "@/services/useExportRequestService";
import { useSelector } from "react-redux";
import StatusTag from "@/components/commons/StatusTag";
import { RootState } from "@/contexts/redux/store";
import dayjs from "dayjs";
import { LegendItem } from "@/components/commons/LegendItem";
import { ExportRequestFilterState, useExportRequestFilter } from "@/hooks/useExportRequestFilter";
import useProviderService from "@/services/useProviderService";
import { Select, DatePicker } from "antd";
const { RangePicker } = DatePicker;
const { Option } = Select;

const ExportRequestList = () => {
  // ========== FILTER STATES ==========
  const { filterState, updateFilter } = useExportRequestFilter();
  const {
    searchTerm,
    selectedExportType,
    selectedStatusFilter,
    pagination,
  } = filterState as ExportRequestFilterState;

  // ========== DATA STATES ==========
  const [exportRequestsData, setExportRequestsData] = useState<ExportRequestResponse[]>([]);
  const [providerNames, setProviderNames] = useState({});
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchFields, setAdvancedSearchFields] = useState({
    exportRequestId: '',
    exportDate: '',
    createdDate: '',
    createdBy: '',
    receiverName: '',
    status: []
  });

  // ========== SERVICES ==========
  const { getAllExportRequests, loading } = useExportRequestService();
  const { getProviderById } = useProviderService();

  // ========== UTILITY FUNCTIONS ==========
  const user = useSelector((state: RootState) => state.user);

  const getStatusRowClass = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'COUNTED':
      case 'COUNT_CONFIRMED':
        return 'bg-[rgba(59,130,246,0.06)]'; // Blue with opacity for waiting confirm
      case 'WAITING_EXPORT':
      case 'EXTENDED':
        return 'bg-[rgba(251,191,36,0.08)]'; // Yellow with opacity for waiting delivery
      case 'COMPLETED':
        return 'bg-[rgba(34,197,94,0.08)]'; // Green with opacity
      case 'CANCELLED':
        return 'bg-[rgba(107,114,128,0.12)]'; // Gray with opacity
      default:
        return 'no-bg-row';
    }
  };

  const fetchExportRequests = async (): Promise<void> => {
    const response = await getAllExportRequests();
    setExportRequestsData(response.content);
  };

  // ========== EFFECTS ==========
  useEffect((): void => {
    fetchExportRequests();
  }, []);

  useEffect(() => {
    // Lấy các providerId khác null/undefined
    const providerIds = Array.from(new Set(exportRequestsData?.map(r => r.providerId).filter(Boolean)));

    const fetchProviderNames = async () => {
      const result = {};
      for (const id of providerIds) {
        try {
          const res = await getProviderById(id);
          result[id] = res.content?.name || "Không xác định";
        } catch {
          result[id] = "Không xác định";
        }
      }
      setProviderNames(result);
    };

    if (providerIds.length) {
      fetchProviderNames();
    }
  }, [exportRequestsData]);

  useEffect(() => {
    if (location.pathname.includes('/export/request-list')) {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && ['SELLING', 'RETURN', 'INTERNAL', 'LIQUIDATION'].includes(tabFromUrl.toUpperCase())) {
        updateFilter({
          selectedExportType: tabFromUrl.toUpperCase(),
          pagination: {
            ...pagination,
            current: 1
          }
        });
      }
    }
  }, [location.search, location.pathname]);

  // ========== EVENT HANDLERS ==========
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateFilter({
      searchTerm: e.target.value,
      pagination: {
        ...pagination,
        current: 1
      }
    });
  };

  const handleTableChange = (page: TablePaginationConfig): void => {
    updateFilter({
      pagination: {
        ...pagination,
        current: page.current,
        pageSize: page.pageSize,
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
  const filteredItems = exportRequestsData?.filter((item) => {
    // Basic search
    const idStr = item.exportRequestId ? item.exportRequestId.toString() : "";
    const matchesBasicSearch = idStr.toLowerCase().includes(searchTerm.toLowerCase());

    // Advanced search
    let matchesAdvancedSearch = true;
    if (showAdvancedSearch) {
      if (advancedSearchFields.exportRequestId &&
        !idStr.toLowerCase().includes(advancedSearchFields.exportRequestId.toLowerCase())) {
        matchesAdvancedSearch = false;
      }
      if (advancedSearchFields.createdBy &&
        !item.createdBy?.toLowerCase().includes(advancedSearchFields.createdBy.toLowerCase())) {
        matchesAdvancedSearch = false;
      }
      if (advancedSearchFields.receiverName &&
        !(item.receiverName || providerNames[item.providerId] || "")
          .toLowerCase().includes(advancedSearchFields.receiverName.toLowerCase())) {
        matchesAdvancedSearch = false;
      }
      if (advancedSearchFields.exportDate &&
        !dayjs(item.exportDate).format("DD-MM-YYYY").includes(advancedSearchFields.exportDate)) {
        matchesAdvancedSearch = false;
      }
      if (advancedSearchFields.createdDate &&
        !dayjs(item.createdDate).format("DD-MM-YYYY").includes(advancedSearchFields.createdDate)) {
        matchesAdvancedSearch = false;
      }
      if (advancedSearchFields.status.length > 0 &&
        !advancedSearchFields.status.includes(item.status)) {
        matchesAdvancedSearch = false;
      }
    }

    // Status filter logic (giữ nguyên)
    let matchesStatusFilter = true;
    switch (selectedStatusFilter) {
      case "WAITING_CONFIRM":
        matchesStatusFilter = item.status === "IN_PROGRESS" ||
          item.status === "COUNTED" ||
          item.status === "COUNT_CONFIRMED";
        break;
      case "WAITING_DELIVERY":
        matchesStatusFilter = item.status === "WAITING_EXPORT" ||
          item.status === "EXTENDED";
        break;
      case "COMPLETED":
        matchesStatusFilter = item.status === "COMPLETED";
        break;
      case "CANCELLED":
        matchesStatusFilter = item.status === "CANCELLED";
        break;
      default:
        matchesStatusFilter = true;
    }

    // Export type filter (giữ nguyên)
    const matchesExportType =
      selectedExportType === "ALL" ? true : selectedExportType.includes(item.type);

    // Quyết định dùng search nào
    const finalSearch = showAdvancedSearch ? matchesAdvancedSearch : matchesBasicSearch;
    return finalSearch && matchesStatusFilter && matchesExportType;
  }).sort((a, b) => {
    // Sort theo mã phiếu xuất từ lớn xuống nhỏ (PX-YYYYMMDD-XXX format)
    return b.exportRequestId.localeCompare(a.exportRequestId);
  });

  const columns = [
    {
      title: "Mã phiếu xuất",
      dataIndex: "exportRequestId",
      key: "exportRequestId",
      render: (exportRequestId: string) => `#${exportRequestId}`,
      width: "15%",
    },
    {
      title: "Ngày xuất",
      dataIndex: "exportDate",
      key: "exportDate",
      render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
      sorter: (a, b) => dayjs(a.exportDate).unix() - dayjs(b.exportDate).unix(),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => dayjs(date).format("DD-MM-YYYY"),
      sorter: (a, b) => dayjs(a.createdDate).unix() - dayjs(b.createdDate).unix(),
    },
    {
      title: "Người lập phiếu",
      dataIndex: "createdBy",
      key: "createdBy",
    },
    {
      title: "Người nhận hàng",
      dataIndex: "receiverName",
      key: "receiver",
      render: (receiverName, record) => {
        return receiverName || providerNames[record.providerId] || "—";
      }
    },
    {
      title: "Trạng thái phiếu",
      dataIndex: "status",
      key: "status",
      align: "center" as "center",
      width: 200,
      render: (status: string) => <StatusTag status={status} type="export" />,
      sorter: (a, b) => {
        const statusOrder = {
          'IN_PROGRESS': 1,
          'COUNTED': 2,
          'COUNT_CONFIRMED': 3,
          'WAITING_EXPORT': 4,
          'EXTENDED': 5,
          'COMPLETED': 6,
          'CANCELLED': 7
        };
        return statusOrder[a.status] - statusOrder[b.status];
      },
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (text: string, record: ExportRequestResponse) => (
        <div className="flex gap-3 justify-center">
          <Tooltip title="Xem chi tiết phiếu xuất" placement="top">
            <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(record.exportRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách phiếu xuất</h1>
        {user?.role === "ROLE_DEPARTMENT" && (
          <Link to={ROUTES.PROTECTED.EXPORT.REQUEST.CREATE}>
            <Button
              type="primary"
              id="btn-create"
              icon={<PlusOutlined />}
            >
              Tạo Phiếu Xuất
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col gap-3 w-full">
          {/* Basic Search */}
          <div className="flex gap-3 items-center">
            <div className="min-w-[300px]">
              <Input
                placeholder="Tìm theo mã phiếu xuất"
                value={searchTerm}
                onChange={handleSearchChange}
                prefix={<SearchOutlined />}
                className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
              />
            </div>
            <Button
              type="default"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              icon={showAdvancedSearch ? <UpOutlined /> : <DownOutlined />}
            >
              Tìm kiếm nâng cao
            </Button>
          </div>

          {/* Advanced Search */}
          {showAdvancedSearch && (
            <div className="bg-gray-50 p-4 rounded border">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã phiếu xuất</label>
                  <Input
                    placeholder="Nhập mã phiếu xuất"
                    value={advancedSearchFields.exportRequestId}
                    onChange={(e) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      exportRequestId: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Người lập phiếu</label>
                  <Input
                    placeholder="Nhập tên người lập phiếu"
                    value={advancedSearchFields.createdBy}
                    onChange={(e) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      createdBy: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Người nhận hàng</label>
                  <Input
                    placeholder="Nhập tên người nhận"
                    value={advancedSearchFields.receiverName}
                    onChange={(e) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      receiverName: e.target.value
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày xuất</label>
                  <DatePicker
                    placeholder="Chọn ngày xuất"
                    value={advancedSearchFields.exportDate ? dayjs(advancedSearchFields.exportDate, "DD-MM-YYYY") : null}
                    onChange={(date) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      exportDate: date ? date.format("DD-MM-YYYY") : ''
                    })}
                    format="DD-MM-YYYY"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày tạo</label>
                  <DatePicker
                    placeholder="Chọn ngày tạo"
                    value={advancedSearchFields.createdDate ? dayjs(advancedSearchFields.createdDate, "DD-MM-YYYY") : null}
                    onChange={(date) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      createdDate: date ? date.format("DD-MM-YYYY") : ''
                    })}
                    format="DD-MM-YYYY"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái phiếu</label>
                  <Select
                    mode="multiple"
                    placeholder="Chọn trạng thái"
                    value={advancedSearchFields.status}
                    onChange={(values) => setAdvancedSearchFields({
                      ...advancedSearchFields,
                      status: values
                    })}
                    className="w-full"
                  >
                    <Option value="IN_PROGRESS">Đang xử lý</Option>
                    <Option value="COUNTED">Đã kiểm đếm</Option>
                    <Option value="COUNT_CONFIRMED">Đã xác nhận kiểm đếm</Option>
                    <Option value="WAITING_EXPORT">Chờ xuất kho</Option>
                    <Option value="EXTENDED">Đã gia hạn</Option>
                    <Option value="COMPLETED">Đã hoàn tất</Option>
                    <Option value="CANCELLED">Đã hủy</Option>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="primary"
                  onClick={() => {
                    // Trigger search - logic sẽ được handle trong filteredItems
                  }}
                >
                  Tìm kiếm
                </Button>
                <Button
                  onClick={() => setAdvancedSearchFields({
                    exportRequestId: '',
                    exportDate: '',
                    createdDate: '',
                    createdBy: '',
                    receiverName: '',
                    status: []
                  })}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!bg-gray-200 [&_.ant-tabs-tab]:!transition-none [&_.ant-tabs-tab]:!font-bold [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-1 [&_.ant-tabs-tab-active]:!border-gray-400 [&_.ant-tabs-tab-active]:!border-b-0 [&_.ant-tabs-tab-active]:!transition-none [&_.ant-tabs-tab-active]:!border-bottom-width-0 [&_.ant-tabs-tab-active]:!border-bottom-style-none [&_.ant-tabs-tab-active]:!font-bold [&_.ant-tabs-tab-active]:!text-[17px]">
        <div className="flex justify-between">
          <Tabs
            activeKey={selectedExportType}
            onChange={(key) => {
              updateFilter({
                selectedExportType: key,
                pagination: {
                  ...pagination,
                  current: 1
                }
              });
            }}
            type="card"
            size="middle"
            items={[
              {
                key: "SELLING",
                label: "Xuất bán",
              },
              {
                key: "RETURN",
                label: "Xuất trả nhà cung cấp",
              },
              {
                key: "INTERNAL",
                label: "Xuất nội bộ",
              },
              {
                key: "LIQUIDATION",
                label: "Xuất thanh lý",
              },

            ]}
          />
          <Space size="large">
            <LegendItem
              color="rgba(59, 130, 246, 0.1)"
              borderColor="rgba(59, 130, 246, 0.5)"
              title="Chờ xác nhận"
              description="Phiếu xuất đang chờ xác nhận"
              clickable={true}
              isSelected={selectedStatusFilter === 'WAITING_CONFIRM'}
              onClick={() => handleStatusFilterClick('WAITING_CONFIRM')}
            />
            <LegendItem
              color="rgba(251, 191, 36, 0.1)"
              borderColor="rgba(251, 191, 36, 0.5)"
              title="Chờ xuất hàng"
              description="Phiếu xuất đang chờ xuất hàng"
              clickable={true}
              isSelected={selectedStatusFilter === 'WAITING_DELIVERY'}
              onClick={() => handleStatusFilterClick('WAITING_DELIVERY')}
            />
            <LegendItem
              color="rgba(34, 197, 94, 0.1)"
              borderColor="rgba(34, 197, 94, 0.5)"
              title="Đã hoàn tất"
              description="Phiếu xuất đã hoàn tất"
              clickable={true}
              isSelected={selectedStatusFilter === 'COMPLETED'}
              onClick={() => handleStatusFilterClick('COMPLETED')}
            />
            <LegendItem
              color="rgba(107, 114, 128, 0.1)"
              borderColor="rgba(107, 114, 128, 0.5)"
              title="Đã hủy"
              description="Phiếu xuất đã bị hủy"
              clickable={true}
              isSelected={selectedStatusFilter === 'CANCELLED'}
              onClick={() => handleStatusFilterClick('CANCELLED')}
            />
          </Space>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="exportRequestId"
        className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${exportRequestsData?.length > 0 ?
          '[&_.ant-table-tbody_tr:hover_td]:!bg-gray-100 [&_.ant-table-tbody_tr.no-bg-row:hover_td]:!bg-gray-100 ' +
          '[&_.ant-table-tbody_tr.status-blue:hover_td]:!bg-[rgba(59,130,246,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-yellow:hover_td]:!bg-[rgba(251,191,36,0.10)] ' +
          '[&_.ant-table-tbody_tr.status-green:hover_td]:!bg-[rgba(34,197,94,0.08)] ' +
          '[&_.ant-table-tbody_tr.status-gray:hover_td]:!bg-[rgba(107,114,128,0.08)]'
          : ''} custom-table mb-4`}
        loading={loading}
        onChange={handleTableChange}
        rowClassName={(record) => {
          const statusClass = getStatusRowClass(record.status);

          // Priority: COMPLETED and CANCELLED > other status colors  
          if (record.status === 'COMPLETED') {
            return `${statusClass} status-green`;
          }

          if (record.status === 'CANCELLED') {
            return `${statusClass} status-gray`;
          }

          // Add status-specific class for hover effects
          if (statusClass !== 'no-bg-row') {
            const statusType =
              (record.status === 'IN_PROGRESS' || record.status === 'COUNTED' || record.status === 'COUNT_CONFIRMED')
                ? 'status-blue'
                : (record.status === 'WAITING_EXPORT' || record.status === 'EXTENDED')
                  ? 'status-yellow'
                  : '';
            return `${statusClass} ${statusType}`;
          }

          return 'no-bg-row';
        }}
        pagination={{
          ...pagination,
          total: filteredItems?.length,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu xuất${selectedStatusFilter ? ' (đã lọc)' : ''}`,
        }}
      />
    </div>
  );
};

export default ExportRequestList;
