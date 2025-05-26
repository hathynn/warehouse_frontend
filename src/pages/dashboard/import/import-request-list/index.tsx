import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag, TablePaginationConfig, DatePicker, Select, Tabs } from "antd";
import StatusTag from "@/components/commons/StatusTag";
import { UnorderedListOutlined, FileAddOutlined, EyeFilled, EyeOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { Link } from "react-router-dom";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportRequestDetailService from "@/hooks/useImportRequestDetailService";
import useProviderService from "@/hooks/useProviderService";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";
import moment from "moment";
import dayjs from "dayjs";

export interface ImportRequestData extends ImportRequestResponse {
  totalExpectQuantityInRequest?: number;
  totalOrderedQuantityInRequest?: number;
  totalActualQuantityInRequest?: number;
  providerName: string;
}

const ImportRequestList: React.FC = () => {
  const [importRequestsData, setImportRequestsData] = useState<ImportRequestData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<moment.Moment | null>(null);
  const [selectedImportType, setSelectedImportType] = useState<string>("ORDER");
  const [selectedProvider, setSelectedProvider] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportRequestsByPage,
    getAllImportRequests,
    loading
  } = useImportRequestService();

  const {
    getImportRequestDetails
  } = useImportRequestDetailService();

  const {
    getAllProviders
  } = useProviderService();

  useEffect(() => {
    fetchImportRequests();
  }, []);

  const fetchImportRequests = async (): Promise<void> => {
    try {
      setDetailsLoading(true);

      const { content } = await getAllImportRequests();

      const { content: providerList = [] } = await getAllProviders();

      const formattedRequests: ImportRequestData[] = await Promise.all(
        (content || []).map(async (request) => {
          // Lấy chi tiết của từng phiếu
          const { content: importRequestDetails = [] } = await getImportRequestDetails(
            request.importRequestId
          );

          // Tính tổng bằng reduce
          const totalExpectQuantityInRequest = importRequestDetails.reduce(
            (runningTotal, detail) => runningTotal + detail.expectQuantity,
            0
          );
          const totalOrderedQuantityInRequest = importRequestDetails.reduce(
            (runningTotal, detail) => runningTotal + detail.orderedQuantity,
            0
          );
          const totalActualQuantityInRequest = importRequestDetails.reduce(
            (runningTotal, detail) => runningTotal + detail.actualQuantity,
            0
          );

          // Tìm nhà cung cấp
          const provider = providerList.find(
            (provider) => provider.id === request.providerId
          );

          return {
            ...request,
            totalExpectQuantityInRequest,
            totalOrderedQuantityInRequest,
            totalActualQuantityInRequest,
            providerName: provider?.name || "",
          };
        })
      );

      setImportRequestsData(formattedRequests);

    } catch (err) {
      console.error("Failed to fetch import requests:", err);
    } finally {
      setDetailsLoading(false);
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


  // const getImportTypeText = (type: string): string => {
  //   switch (type) {
  //     case "ORDER":
  //       return "Nhập hàng mới";
  //     case "RETURN":
  //       return "Nhập hàng trả";
  //     default:
  //       return type;
  //   }
  // };

  // Extract all batch numbers for a given date string (YYYY-MM-DD)
  // const getBatchesForDate = (dateStr: string) => {
  //   return importRequestsData
  //     .filter(item => item.batchCode && item.batchCode.startsWith(dateStr))
  //     .map(item => item.batchCode.split('_')[1])
  //     .filter((batch, idx, arr) => arr.indexOf(batch) === idx);
  // };

  // Filtered data logic
  const filteredItems = importRequestsData.filter((item) => {
    const matchesSearch = item.importRequestId.toString().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate ? selectedDate.format('YYYY-MM-DD') === item.createdDate?.split('T')[0] : true;
    const matchesImportType = selectedImportType === "ALL" ? true : item.importType === selectedImportType;
    const matchesProvider = selectedProvider.length > 0 ? selectedProvider.includes(item.providerName) : true;
    const matchesStatus = selectedStatus.length > 0 ? selectedStatus.includes(item.status) : true;

    return matchesSearch && matchesDate && matchesImportType && matchesProvider && matchesStatus;
  });

  // Get unique providers from data
  const uniqueProviders = Array.from(new Set(importRequestsData.map(item => item.providerName))).filter(Boolean);

  // Get status options
  const statusOptions = [
    { label: 'Chưa bắt đầu', value: 'NOT_STARTED' },
    { label: 'Đang xử lý', value: 'IN_PROGRESS' },
    { label: 'Đã kiểm đếm', value: 'COUNTED' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Hoàn tất', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Đã gia hạn', value: 'EXTENDED' }
  ];

  const columns = [
    {
      title: "Mã phiếu nhập",
      dataIndex: "importRequestId",
      key: "importRequestId",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (id: number) => `#${id}`,
    },
    {
      title: "Ngày có hiệu lực",
      dataIndex: "startDate",
      key: "startDate",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportRequestData, b: ImportRequestData) => {
        const dateA = dayjs(a.startDate);
        const dateB = dayjs(b.startDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo ngày có hiệu lực'
      },
      render: (startDate: string) => {
        const formattedStartDate = dayjs(startDate).format("DD-MM-YYYY");
        return <strong>{formattedStartDate}</strong>;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "endDate",
      key: "endDate",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      sorter: (a: ImportRequestData, b: ImportRequestData) => {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1; // null values go to end
        if (!b.endDate) return -1;
        const dateA = dayjs(a.endDate);
        const dateB = dayjs(b.endDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      },
      showSorterTooltip: {
        title: 'Sắp xếp theo ngày hết hạn'
      },
      render: (endDate: string) => {
        return endDate ? <strong>{dayjs(endDate).format("DD-MM-YYYY")}</strong> : <span className="text-gray-400">Không có</span>;
      },
    },
    // {
    //   title: "Loại nhập",
    //   dataIndex: "importType",
    //   key: "importType",
    //   align: "left" as const,
    //   onHeaderCell: () => ({
    //     style: { textAlign: 'center' as const }
    //   }),
    //   render: (type: string) => getImportTypeText(type),
    // },
    // {
    //   title: "Đợt nhập",
    //   dataIndex: "batchCode",
    //   key: "batchCode",
    //   align: "center" as const,
    //   onHeaderCell: () => ({
    //     style: { textAlign: 'center' as const }
    //   }),
    //   render: (batchCode: string) => {
    //     // batchCode: "2025-05-03_1"
    //     if (!batchCode) return '';
    //     const [dateStr, batchNum] = batchCode.split('_');
    //     const [year, month, day] = dateStr.split('-');
    //     return (
    //       <div className="text-center">
    //         <div className="font-bold">Đợt {batchNum}</div>
    //         <div className="">Ngày {day}-{month}-{year}</div>
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Tổng dự nhập",
      dataIndex: "totalExpectQuantityInRequest",
      key: "totalExpectQuantityInRequest",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (quantity: number) => <div className="text-lg">{quantity || 0}</div>,
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "totalOrderedQuantityInRequest",
      key: "totalOrderedQuantityInRequest",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (ordered: number, record: ImportRequestData) => {
        const expected = record.totalExpectQuantityInRequest || 0;
        const isEnough = ordered >= expected;
        return (
          <div className="text-right">
            {ordered === 0 ? (
              <span className="font-bold text-gray-600">Chưa lên đơn</span>
            ) : (
              <>
                <div className="text-lg">{ordered}</div>
                {expected > 0 && (
                  <span className={`font-bold ${isEnough ? 'text-green-600' : 'text-red-600'}`}>
                    {isEnough ? "" : `Thiếu ${expected - ordered}`}
                  </span>
                )}
              </>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng đã nhập",
      dataIndex: "totalActualQuantityInRequest",
      key: "totalActualQuantityInRequest",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (actual: number, record: ImportRequestData) => {
        const expected = record.totalExpectQuantityInRequest || 0;
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
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      align: "left" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (status: string) => <StatusTag status={status} type="import" />,

    },
    {
      title: "Hành động",
      key: "action",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: unknown, record: ImportRequestData) => (
        <div className="flex gap-3 justify-center">
          <Tooltip title="Xem chi tiết phiếu nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(record.importRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
          <Tooltip title="Xem danh sách đơn nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(record.importRequestId)}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 bg-blue-900 text-white hover:bg-blue-700 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <UnorderedListOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
          {/* <Tooltip title="Tạo đơn nhập cho phiếu này" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(record.importRequestId.toString())}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 30, height: 30 }}>
                <FileAddOutlined style={{ fontSize: 16, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip> */}
        </div>
      ),
    },
  ];

  return (
    <div className={`mx-auto ImportRequestList`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Danh sách phiếu nhập</h1>
        <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.CREATE}>
          <Button
            type="primary"
            id="btn-create"
            icon={<PlusOutlined />}
          >
            Tạo Phiếu Nhập
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <div className="min-w-[300px]">
          <Input
            placeholder="Tìm theo mã phiếu nhập"
            value={searchTerm}
            onChange={handleSearchChange}
            prefix={<SearchOutlined />}
            className="!border-gray-400 [&_input::placeholder]:!text-gray-400"
          />
        </div>

        {/* <DatePicker
          placeholder="Chọn ngày nhập"
          format="DD-MM-YYYY"
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setSelectedBatch(null);
          }}
          className="ml-2 font-bold text-black"
          style={{ color: '#111', fontWeight: 600 }}
          allowClear
        /> */}
        {/* {selectedDate && (
          <Select
            allowClear
            placeholder="Chọn đợt nhập"
            className="min-w-[120px] font-bold text-black"
            style={{ color: '#111', fontWeight: 600 }}
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={getBatchesForDate(selectedDate.format('YYYY-MM-DD')).map(batch => ({ label: `Đợt ${batch}`, value: batch }))}
          />
        )} */}
        <div className="flex gap-2 items-center">
          <Select
            mode="multiple"
            placeholder="Nhà cung cấp"
            className="min-w-[300px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
            value={selectedProvider}
            onChange={setSelectedProvider}
            allowClear
            maxTagCount="responsive"
            options={uniqueProviders.map(provider => ({ label: provider, value: provider }))}
          />
          <Select
            mode="multiple"
            placeholder="Trạng thái"
            className="min-w-[150px] text-black [&_.ant-select-selector]:!border-gray-400 [&_.ant-select-selection-placeholder]:!text-gray-400 [&_.ant-select-clear]:!text-lg [&_.ant-select-clear]:!flex [&_.ant-select-clear]:!items-center [&_.ant-select-clear]:!justify-center [&_.ant-select-clear_svg]:!w-5 [&_.ant-select-clear_svg]:!h-5"
            value={selectedStatus}
            onChange={setSelectedStatus}
            allowClear
            maxTagCount="responsive"
            options={statusOptions}
          />
        </div>
      </div>

      <div className="mb-4 [&_.ant-tabs-nav]:!mb-0 [&_.ant-tabs-tab]:!bg-gray-200 [&_.ant-tabs-tab]:!transition-none [&_.ant-tabs-tab]:!font-bold [&_.ant-tabs-tab-active]:!bg-white [&_.ant-tabs-tab-active]:!border-1 [&_.ant-tabs-tab-active]:!border-gray-400 [&_.ant-tabs-tab-active]:!border-b-0 [&_.ant-tabs-tab-active]:!transition-none [&_.ant-tabs-tab-active]:!border-bottom-width-0 [&_.ant-tabs-tab-active]:!border-bottom-style-none [&_.ant-tabs-tab-active]:!font-bold [&_.ant-tabs-tab-active]:!text-[17px]">
        <Tabs
          activeKey={selectedImportType}
          onChange={setSelectedImportType}
          type="card"
          size="middle"
          items={[
            {
              key: "ORDER",
              label: "Nhập hàng mới",
            },
            {
              key: "RETURN",
              label: "Nhập trả",
            },
            {
              key: "ALL",
              label: "Tất cả",
            },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="importRequestId"
        loading={loading || detailsLoading}
        onChange={handleTableChange}
        className={`[&_.ant-table-cell]:!p-3 [&_.ant-table-thead_th.ant-table-column-has-sorters:hover]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters:active]:!bg-transparent [&_.ant-table-thead_th.ant-table-column-has-sorters]:!transition-none [&_.ant-table-tbody_td.ant-table-column-sort]:!bg-transparent ${importRequestsData.length > 0 ? '[&_.ant-table-tbody_tr:hover_td]:!bg-[rgba(0,0,0,0.06)] [&_.ant-table-tbody_tr:hover_td.ant-table-column-sort]:!bg-[rgba(0,0,0,0.07)]' : ''}`}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          locale: {
            items_per_page: "/ trang"
          },
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu nhập`,
        }}
      />
    </div>
  );
};

export default ImportRequestList; 