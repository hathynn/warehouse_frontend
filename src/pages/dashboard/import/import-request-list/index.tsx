import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag, TablePaginationConfig, DatePicker, Select } from "antd";
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
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    getImportRequestsByPage,
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
  }, [pagination.current, pagination.pageSize]);

  const fetchImportRequests = async (): Promise<void> => {
    try {
      setDetailsLoading(true);

      const { content, metaDataDTO } = await getImportRequestsByPage(
        pagination.current || 1,
        pagination.pageSize || 10
      );

      const { content: providerList = [] } = await getAllProviders();

      const formattedRequests: ImportRequestData[] = await Promise.all(
        (content || []).map(async (request) => {
          // Lấy chi tiết của từng phiếu
          const { content: importRequestDetails = [] } = await getImportRequestDetails(
            request.importRequestId,
            1,
            1000
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

      // cập nhật phân trang
      setPagination({
        current: metaDataDTO?.page,
        pageSize: metaDataDTO?.limit,
        total: metaDataDTO?.total,
      });
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

  

  const getImportTypeText = (type: string): string => {
    switch (type) {
      case "ORDER":
        return "Nhập hàng mới";
      case "RETURN":
        return "Nhập hàng trả";
      default:
        return type;
    }
  };

  // Extract all batch numbers for a given date string (YYYY-MM-DD)
  const getBatchesForDate = (dateStr: string) => {
    return importRequestsData
      .filter(item => item.batchCode && item.batchCode.startsWith(dateStr))
      .map(item => item.batchCode.split('_')[1])
      .filter((batch, idx, arr) => arr.indexOf(batch) === idx);
  };

  // Filtered data logic
  const filteredItems = importRequestsData.filter((item) => {
    const matchesSearch = item.importRequestId.toString().includes(searchTerm.toLowerCase());
    if (selectedDate) {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      if (selectedBatch) {
        return matchesSearch && item.batchCode === `${dateStr}_${selectedBatch}`;
      } else {
        return matchesSearch && item.batchCode && item.batchCode.startsWith(dateStr);
      }
    }
    return matchesSearch;
  });

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "importRequestId",
      key: "importRequestId",
      align: "right" as const,
      render: (id: number) => `#${id}`,
      width: '8%',
    },
    {
      title: "Loại nhập",
      dataIndex: "importType",
      key: "importType",
      align: "left" as const,
      render: (type: string) => getImportTypeText(type),
    },
    {
      title: "Đợt nhập",
      dataIndex: "batchCode",
      key: "batchCode",
      align: "center" as const,
      render: (batchCode: string) => {
        // batchCode: "2025-05-03_1"
        if (!batchCode) return '';
        const [dateStr, batchNum] = batchCode.split('_');
        const [year, month, day] = dateStr.split('-');
        return (
          <div className="text-center">
            <div className="font-bold">Đợt {batchNum}</div>
            <div className="">Ngày {day}-{month}-{year}</div>
          </div>
        );
      },
    },
    {
      title: "Tổng dự nhập",
      dataIndex: "totalExpectQuantityInRequest",
      key: "totalExpectQuantityInRequest",
      align: "right" as const,
      render: (quantity: number) => <div className="text-lg">{quantity || 0}</div>,
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "totalOrderedQuantityInRequest",
      key: "totalOrderedQuantityInRequest",
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
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => <StatusTag status={status} type="import" />,

    },
    {
      title: "Hành động",
      key: "action",
      align: "center" as const,
      render: (_: unknown, record: ImportRequestData) => (
        <div className="flex gap-3 justify-center">
          <Tooltip title="Xem chi tiết phiếu nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(record.importRequestId.toString())}>
              <span className="inline-flex items-center justify-center rounded-full border-2 border-blue-900 text-blue-900 hover:bg-blue-100 hover:border-blue-700 hover:shadow-lg cursor-pointer" style={{ width: 32, height: 32 }}>
                <EyeOutlined style={{ fontSize: 20, fontWeight: 700 }} />
              </span>
            </Link>
          </Tooltip>
          <Tooltip title="Xem danh sách đơn nhập" placement="top">
            <Link to={ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(record.importRequestId.toString())}>
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
    <div className={`mx-auto`}>
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
        <Input
          placeholder="Tìm kiếm theo mã phiếu nhập"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          className="max-w-md font-bold text-black"
          style={{ color: '#111', fontWeight: 600 }}
        />
        <DatePicker
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
        />
        {selectedDate && (
          <Select
            allowClear
            placeholder="Chọn đợt nhập"
            className="min-w-[120px] font-bold text-black"
            style={{ color: '#111', fontWeight: 600 }}
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={getBatchesForDate(selectedDate.format('YYYY-MM-DD')).map(batch => ({ label: `Đợt ${batch}`, value: batch }))}
          />
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="importRequestId"
        loading={loading || detailsLoading}
        onChange={handleTableChange}
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