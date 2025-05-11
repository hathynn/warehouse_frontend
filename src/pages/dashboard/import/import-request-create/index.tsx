import { useState, useEffect, useRef, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Select, Typography, Space, Card, Alert } from "antd";
import useImportRequestService, { ImportRequestCreateRequest } from "@/hooks/useImportRequestService";
import useProviderService, { ProviderResponse } from "@/hooks/useProviderService";
import useItemService, { ItemResponse } from "@/hooks/useItemService";
import useImportRequestDetailService, { ImportRequestDetailRequest } from "@/hooks/useImportRequestDetailService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import ExcelUploadSection from "@/components/commons/ExcelUploadSection";
import TableSection from "@/components/commons/TableSection";
import EditableImportRequestTableSection from "@/components/import-flow/EditableImportRequestTableSection";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ImportRequestDetailRow {
  itemId: number;
  quantity: number;
  providerId: number;
  itemName: string;
  providerName: string;
  measurementUnit?: string;
  totalMeasurementValue?: number;
}

interface FormData {
  importReason: string;
  importType: "ORDER" | "RETURN";
  exportRequestId: number | null;
}

const ImportRequestCreate: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<ImportRequestDetailRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    importReason: "",
    importType: "ORDER",
    exportRequestId: null,
  });
  const [providers, setProviders] = useState<ProviderResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [validationError, setValidationError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Handler for page change
  const handleChangePage = (paginationObj: any) => {
    setPagination(prev => ({
      ...prev,
      current: paginationObj.current,
      pageSize: paginationObj.pageSize || prev.pageSize,
    }));
    // Nếu có API backend cho phân trang, gọi lại API ở đây
    // fetchImportRequestDetails(paginationObj.current, paginationObj.pageSize)
  };


  const {
    loading: importLoading,
    createImportRequest,
  } = useImportRequestService();

  const {
    loading: importRequestDetailLoading,
    createImportRequestDetail
  } = useImportRequestDetailService();

  const {
    loading: providerLoading,
    getAllProviders
  } = useProviderService();

  const {
    loading: itemLoading,
    getItems
  } = useItemService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [providersResponse, itemsResponse] = await Promise.all([
          getAllProviders(),
          getItems()
        ]);

        if (providersResponse?.content && itemsResponse?.content) {
          setProviders(providersResponse.content);
          setItems(itemsResponse.content);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const ab = event.target?.result;
        if (ab instanceof ArrayBuffer) {
          const wb = XLSX.read(ab, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws);
          try {
            const transformedData: ImportRequestDetailRow[] = jsonData.map((item: any, index: number) => {
              const itemId = item["itemId"] || item["Mã hàng"];
              const quantity = item["quantity"] || item["Số lượng"];
              const providerId = item["providerId"] || item["Nhà cung cấp"];
              if (!itemId || !quantity || !providerId) {
                throw new Error(`Dòng ${index + 1}: Thiếu thông tin Mã hàng, Số lượng hoặc Nhà cung cấp`);
              }
              const foundItem = items.find(i => i.id === Number(itemId));
              if (!foundItem) {
                throw new Error(`Dòng ${index + 1}: Không tìm thấy mặt hàng với mã ${itemId}`);
              }
              const foundProvider = providers.find(p => p.id === Number(providerId));
              if (!foundProvider) {
                throw new Error(`Dòng ${index + 1}: Không tìm thấy nhà cung cấp với ID ${providerId}`);
              }
              // Validate the provider is actually linked to the item
              if (!Array.isArray(foundItem.providerIds) || !foundItem.providerIds.includes(Number(providerId))) {
                throw new Error(`Dòng ${index + 1}: Nhà cung cấp ID ${providerId} không phải là nhà cung cấp của mặt hàng mã ${itemId}`);
              }
              return {
                itemId: Number(itemId),
                quantity: Number(quantity),
                providerId: Number(providerId),
                itemName: foundItem.name,
                measurementUnit: foundItem.measurementUnit || "Unknown",
                totalMeasurementValue: foundItem.totalMeasurementValue || 0,
                providerName: foundProvider.name
              };
            });
            setData(transformedData);
            setValidationError("");
          } catch (error) {
            if (error instanceof Error) {
              setValidationError(error.message);
              toast.error(error.message);
            }
          }
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "itemId": "Mã hàng (số)",
        "quantity": "Số lượng (số)",
        "providerId": "Mã Nhà cung cấp (số)"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import_request_template.xlsx");
  };

  const handleSubmit = async () => {
    if (!formData.importReason) {
      toast.error("Vui lòng nhập lý do nhập kho");
      return;
    }
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }
    try {
      const createRequest: ImportRequestCreateRequest = {
        ...formData
      };
      const createdRequest = await createImportRequest(createRequest);
      if (createdRequest?.content?.importRequestId) {
        const details: ImportRequestDetailRequest[] = data.map(row => ({
          itemId: row.itemId,
          quantity: row.quantity,
          providerId: row.providerId
        }));
        await createImportRequestDetail(details, createdRequest.content.importRequestId);
        navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);
        setFormData({
          importReason: "",
          importType: "ORDER",
          exportRequestId: null,
        });
        setFile(null);
        setFileName("");
        setData([]);
      }
    } catch (error) { }
  };

  // --- columns readonly cho TableSection (không render input/dropdown) ---
const columns = [
  {
    title: <span className="font-semibold">Tên hàng</span>,
    dataIndex: "itemName",
    key: "itemName",
    width: "25%",
  },
  {
    title: <span className="font-semibold">Số lượng</span>,
    dataIndex: "quantity",
    key: "quantity",
    align: "right" as const,
    width: "15%",
  },
  {
    title: <span className="font-semibold">Giá trị đo lường</span>,
    dataIndex: "totalMeasurementValue",
    key: "totalMeasurementValue",
    align: "right" as const,
    width: "15%",
  },
  {
    title: <span className="font-semibold">Đơn vị tính</span>,
    dataIndex: "measurementUnit",
    key: "measurementUnit",
    width: "10%",
  },
  {
    title: <span className="font-semibold">Nhà cung cấp</span>,
    dataIndex: "providerName",
    key: "providerName",
    width: "35%",
  },
];

  const loading = importLoading || providerLoading || itemLoading || importRequestDetailLoading;

  return (
    <div className="container mx-auto p-2">
      <Title level={2}>Tạo phiếu nhập kho</Title>

      {step === 0 && (
        <div className="mt-4 flex flex-col items-center gap-6">
          <div className="w-full">
            <ExcelUploadSection
              fileName={fileName}
              onFileChange={handleFileUpload}
              onDownloadTemplate={downloadTemplate}
              fileInputRef={fileInputRef}
              buttonLabel="Tải lên file Excel"
            />
            <EditableImportRequestTableSection
              data={data.slice((pagination.current - 1) * pagination.pageSize, pagination.current * pagination.pageSize)}
              setData={setData}
              items={items}
              providers={providers}
              loading={false}
              alertNode={data.length > 0 ? (
                <Alert
                  message="Thông tin nhập kho"
                  description={
                    <>
                      <p>Số lượng nhà cung cấp: {Array.from(new Set(data.map(item => item.providerId))).length}</p>
                      <p>Tổng số mặt hàng: {data.length}</p>
                      <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập kho riêng cho từng nhà cung cấp</p>
                    </>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
              ) : null}
              emptyText="Vui lòng tải lên file Excel để xem chi tiết hàng hóa"
              title="Danh sách hàng hóa từ file Excel"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: data.length,
                showSizeChanger: true
              }}
              onChangePage={handleChangePage}
            />
          </div>
          <Button
            type="primary"
            onClick={() => setStep(1)}
            disabled={data.length === 0 || !!validationError}
          >
            Tiếp tục nhập thông tin phiếu nhập
            <ArrowRightOutlined />
          </Button>
        </div>
      )}
      {step === 1 && (
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setStep(0)}
            type="primary"
          >
            Quay lại
          </Button>
          <div className="mt-4 flex gap-6">
            <Card title="Thông tin phiếu nhập" className="w-3/10">
              <Space direction="vertical" className="w-full">
                <div>
                  <label className="block mb-1">Lý do nhập kho <span className="text-red-500">*</span></label>
                  <TextArea
                    placeholder="Nhập lý do"
                    rows={4}
                    value={formData.importReason}
                    onChange={(e) => setFormData({ ...formData, importReason: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">Loại nhập kho <span className="text-red-500">*</span></label>
                  <Select
                    value={formData.importType}
                    onChange={(value) => setFormData({ ...formData, importType: value })}
                    className="w-full"
                  >
                    <Option value="ORDER">Nhập theo kế hoạch</Option>
                    <Option value="RETURN">Nhập trả</Option>
                  </Select>
                </div>
                <Alert
                  message="Lưu ý"
                  description="Hệ thống sẽ tự động tạo các phiếu nhập kho riêng biệt cho từng nhà cung cấp dựa trên dữ liệu từ file Excel."
                  type="info"
                  showIcon
                  className="!p-4"
                />
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  className="w-full mt-4"
                  id="btn-detail"
                  disabled={data.length === 0 || !!validationError}
                >
                  Xác nhận tạo phiếu
                </Button>
              </Space>
            </Card>
            <div className="w-7/10">
              <TableSection
                title="Danh sách hàng hóa từ file Excel"
                columns={columns}
                data={data}
                rowKey={(record, index) => index}
                loading={false}
                alertNode={data.length > 0 ? (
                  <Alert
                    message="Thông tin nhập kho"
                    description={
                      <>
                        <p>Số lượng nhà cung cấp: {Array.from(new Set(data.map(item => item.providerId))).length}</p>
                        <p>Tổng số mặt hàng: {data.length}</p>
                        <p className="text-blue-500">Hệ thống sẽ tự động tạo phiếu nhập kho riêng cho từng nhà cung cấp</p>
                      </>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                ) : null}
                emptyText="Vui lòng tải lên file Excel để xem chi tiết hàng hóa"
              />
            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default ImportRequestCreate;
