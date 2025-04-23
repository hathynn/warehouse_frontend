import { useState, useEffect, useRef, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Select, Table, Typography, Space, Card, Alert } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import useImportRequestService, { ImportRequestCreateRequest } from "@/hooks/useImportRequestService";
import useProviderService, { ProviderResponse } from "@/hooks/useProviderService";
import useItemService, { ItemResponse } from "@/hooks/useItemService";
import useImportRequestDetailService from "@/hooks/useImportRequestDetailService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ImportRequestDetailRow {
  itemId: number;
  quantity: number;
  providerId: number;
  itemName: string;
  providerName: string;
}

interface FormData {
  importReason: string;
  importType: "ORDER" | "RETURN";
  exportRequestId: number | null;
}

const ImportRequestCreate: React.FC = () => {
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
              
              if (!itemId || !quantity) {
                throw new Error(`Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`);
              }
              
              // Tìm item từ danh sách items
              const foundItem = items.find(i => i.id === Number(itemId));
              if (!foundItem) {
                throw new Error(`Dòng ${index + 1}: Không tìm thấy mặt hàng với mã ${itemId}`);
              }

              // Tìm provider từ danh sách providers dựa vào providerId của item
              const foundProvider = providers.find(p => p.id === foundItem.providerId);
              if (!foundProvider) {
                throw new Error(`Dòng ${index + 1}: Không tìm thấy nhà cung cấp cho mặt hàng ${foundItem.name}`);
              }
              
              return {
                itemId: Number(itemId),
                quantity: Number(quantity),
                providerId: foundProvider.id,
                itemName: foundItem.name,
                measurementUnit: foundItem.measurementUnit || "Unknown",
                totalMeasurementValue: foundItem.totalMeasurementValue || 0,
                providerName: foundProvider.name
              };
            });

            // Nhóm các items theo provider để hiển thị thông tin
            const providerGroups = transformedData.reduce((groups, item) => {
              const providerId = item.providerId;
              if (!groups[providerId]) {
                groups[providerId] = [];
              }
              groups[providerId].push(item);
              return groups;
            }, {} as Record<number, ImportRequestDetailRow[]>);
            
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const template = [
      {
        "itemId": "Mã hàng (số)",
        "quantity": "Số lượng (số)"
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
        await createImportRequestDetail(file, createdRequest.content.importRequestId);
        
        navigate(ROUTES.PROTECTED.IMPORT.REQUEST.LIST);        
        // Reset form
        setFormData({
          importReason: "",
          importType: "ORDER",
          exportRequestId: null,
        });
        setFile(null);
        setFileName("");
        setData([]);
      }
    } catch (error) {

    }
  };

  const columns = [
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
      width: "20%",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Giá trị đo lường",
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
    },
    {
      title: "Đơn vị tính",
      dataIndex: "measurementUnit",
      key: "measurementUnit",
    },

    {
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      width: "40%",
      render: (text: string, record: ImportRequestDetailRow) => `${text}`
    }
  ];

  const loading = importLoading || providerLoading || itemLoading || importRequestDetailLoading;

  return (
    <div className="container mx-auto p-5">
      <Title level={2}>Tạo phiếu nhập kho</Title>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu nhập" className="w-1/3">
          <Space direction="vertical" className="w-full">
            <div>
              <label className="block mb-1">Lý do nhập kho <span className="text-red-500">*</span></label>
              <TextArea
                placeholder="Nhập lý do"
                rows={4}
                value={formData.importReason}
                onChange={(e) => setFormData({...formData, importReason: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-1">Loại nhập kho <span className="text-red-500">*</span></label>
              <Select
                value={formData.importType}
                onChange={(value) => setFormData({...formData, importType: value})}
                className="w-full"
              >
                <Option value="ORDER">Nhập theo kế hoạch</Option>
                <Option value="RETURN">Nhập trả</Option>
              </Select>
            </div>
            
            <div className="mt-2">
              <Alert
                message="Lưu ý"
                description="Hệ thống sẽ tự động tạo các phiếu nhập kho riêng biệt cho từng nhà cung cấp dựa trên dữ liệu từ file Excel."
                type="info"
                showIcon
              />
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">              
              {/* Button group container */}
              <div className="flex flex-col gap-3">
                {/* Buttons row - added justify-center */}
                <div className="flex gap-3 justify-center">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={downloadTemplate}
                  >
                    Tải mẫu Excel
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={triggerFileInput}
                    className="bg-blue-100 hover:bg-blue-200 border-blue-300"
                  >
                    Tải lên file Excel
                  </Button>
                </div>

                {/* File name display - added justify-center */}
                {fileName && (
                  <div className="flex items-center justify-center bg-white px-3 py-2 rounded-md border border-gray-200">
                    <span className="text-gray-600">
                      File đã chọn: <span className="font-medium text-gray-800">{fileName}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

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
        
        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            {data.length > 0 ? (
              <>
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
                <Table 
                  columns={columns} 
                  dataSource={data} 
                  rowKey={(record, index) => index}
                  pagination={{ pageSize: 10 }}
                  className="custom-table"
                />
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImportRequestCreate;
