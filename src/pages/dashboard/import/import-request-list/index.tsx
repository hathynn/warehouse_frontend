import React, { useState, useEffect } from "react";
import { Table, Button, Input, Tag, TablePaginationConfig } from "antd";
import { Link } from "react-router-dom";
import useImportRequestService, { ImportRequestResponse } from "@/hooks/useImportRequestService";
import useImportRequestDetailService from "@/hooks/useImportRequestDetailService";
import useProviderService from "@/hooks/useProviderService";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { ROUTES } from "@/constants/routes";

interface ImportRequestData extends ImportRequestResponse {
  totalExpectQuantityInRequest: number;
  totalOrderedQuantityInRequest: number;
  totalActualQuantityInRequest: number;
  providerName: string;
}

const ImportRequestList: React.FC = () => {
  const [importRequestsData, setImportRequestsData] = useState<ImportRequestData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
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
        current: metaDataDTO.page,
        pageSize: metaDataDTO.limit,
        total: metaDataDTO.total,
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

  const getStatusTag = (status: string): React.ReactNode => {
    switch (status) {
      case "NOT_STARTED":
        return <Tag color="default">Chưa bắt đầu</Tag>;
      case "IN_PROGRESS":
        return <Tag color="processing">Đang xử lý</Tag>;
      case "COMPLETED":
        return <Tag color="success">Hoàn tất</Tag>;
      case "CANCELLED":
        return <Tag color="error">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
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

  const filteredItems = importRequestsData.filter((item) =>
    item.importRequestId.toString().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "importRequestId",
      key: "importRequestId",
      align: "center" as const,
      render: (id: number) => `#${id}`,
      width: '8%',
    },
    {
      title: "Loại nhập",
      dataIndex: "importType",
      key: "importType",
      align: "center" as const,
      render: (type: string) => getImportTypeText(type),
    },
    {
      title: "Tổng dự nhập",
      dataIndex: "totalExpectQuantityInRequest",
      key: "totalExpectQuantityInRequest",
      align: "center" as const,
      render: (quantity: number) => <div className="text-xl">{quantity || 0}</div>,
    },
    {
      title: "Tổng đã lên đơn",
      dataIndex: "totalOrderedQuantityInRequest",
      key: "totalOrderedQuantityInRequest",
      align: "center" as const,
      render: (ordered: number, record: ImportRequestData) => {
        const expected = record.totalExpectQuantityInRequest || 0;
        const isEnough = ordered >= expected;
        return (
          <div className="text-center">
            <div className="text-xl">{ordered}</div>
            {expected > 0 && (
              <span className={`font-bold ${isEnough ? 'text-green-600' : 'text-red-600'}`}>
                {isEnough ? "Đủ" : `Thiếu ${expected - ordered}`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Tổng đã nhập",
      dataIndex: "totalActualQuantityInRequest",
      key: "totalActualQuantityInRequest",
      align: "center" as const,
      render: (actual: number, record: ImportRequestData) => {
        const expected = record.totalExpectQuantityInRequest || 0;
        const isEnough = actual >= expected;
        return (
          <div className="text-center">
            <div className="text-xl">{actual}</div>
            {expected > 0 && (
              <span className={`font-bold ${isEnough ? 'text-green-600' : 'text-red-600'}`}>
                {isEnough ? "Đủ" : `Thiếu ${expected - actual}`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      align: "center" as const,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      align: "center" as const,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "Chi tiết",
      key: "detail",
      align: "center" as const,
      render: (_: unknown, record: ImportRequestData) => (
        <Link to={ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(record.importRequestId.toString())}>
          <Button id="btn-detail" className="!p-2 !text-white !font-bold !bg-blue-900 hover:!bg-blue-500" type="link">
            Xem chi tiết
          </Button>
        </Link>
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

      <div className="mb-4">
        <Input
          placeholder="Tìm kiếm theo mã phiếu nhập"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchOutlined />}
          className="max-w-md"
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredItems}
        rowKey="importRequestId"
        className="custom-table"
        loading={loading || detailsLoading}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['10', '50'],
          showTotal: (total: number) => `Tổng cộng có ${total} phiếu nhập`,
        }}
      />
    </div>
  );
};

export default ImportRequestList; 