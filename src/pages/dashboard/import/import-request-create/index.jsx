import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Select, Table, Typography, Space, Card, Alert } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import useProviderService from "../../../../hooks/useProviderService";
import useItemService from "../../../../hooks/useItemService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DEPARTMENT_ROUTER } from "@/constants/routes";
import useImportRequestDetailService from "@/hooks/useImportRequestDetailService";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ImportRequestCreate = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    importReason: "",
    importType: "ORDER",
    exportRequestId: null,
  });
  const [providers, setProviders] = useState([]);
  const [items, setItems] = useState([]);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const {
    loading: importLoading,
    createImportRequest,
  } = useImportRequestService();

  const {
    loading: importRequestDetailLoading,
    uploadImportRequestDetail
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
        const [providersData, itemsData] = await Promise.all([
          getAllProviders(),
          getItems()
        ]);
        setProviders(providersData || []);
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể lấy dữ liệu cần thiết");
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const ab = event.target.result;
        const wb = XLSX.read(ab, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        // Validate and transform the data
        try {
          const transformedData = jsonData.map((item, index) => {
            const itemId = item["itemId"] || item["Mã hàng"];
            const quantity = item["quantity"] || item["Số lượng"];
            const providerId = item["providerId"] || item["Mã nhà cung cấp"];
            
            if (!itemId || !quantity) {
              throw new Error(`Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`);
            }
            
            if (!providerId) {
              throw new Error(`Dòng ${index + 1}: Thiếu thông tin Mã nhà cung cấp`);
            }
            
            // Find item name for display
            const itemName = items.find(i => i.id === Number(itemId))?.name || "Unknown";
            // Find provider name for display
            const providerName = providers.find(p => p.id === Number(providerId))?.name || "Unknown";
            
            return {
              itemId: Number(itemId),
              quantity: Number(quantity),
              providerId: Number(providerId),
              itemName,
              providerName
            };
          });
          
          setData(transformedData);
          setValidationError("");
        } catch (error) {
          setValidationError(error.message);
          toast.error(error.message);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const downloadTemplate = () => {
    const template = [
      {
        "itemId": "Mã hàng (số)",
        "quantity": "Số lượng (số)",
        "providerId": "Mã nhà cung cấp (số)"
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
    
    // Check if all items have the same providerId
    const uniqueProviderIds = [...new Set(data.map(item => item.providerId))];
    if (uniqueProviderIds.length > 1) {
      toast.error("Tất cả các mặt hàng phải từ cùng một nhà cung cấp");
      return;
    }
    
    try {
      // Bước 1: Tạo import request với providerId từ file Excel
      const createdRequest = await createImportRequest({
        ...formData,
        providerId: data[0].providerId // Lấy providerId từ dòng đầu tiên trong file Excel
      });
      if (createdRequest) {
        // Bước 2: Upload file Excel cho import request detail
        await uploadImportRequestDetail(file, createdRequest.importRequestId);
        
        toast.success("Tạo phiếu nhập kho thành công!");
        navigate(DEPARTMENT_ROUTER.IMPORT.REQUEST.LIST);
        // Reset form sau khi tạo thành công
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
      console.error("Error submitting form:", error);
      toast.error("Có lỗi xảy ra khi tạo phiếu nhập kho");
    }
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Tên hàng",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "providerName",
      key: "providerName",
      render: (text, record) => `${record.providerId} - ${text}`
    }
  ];

  const loading = importLoading || providerLoading || itemLoading || importRequestDetailLoading;

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo phiếu nhập kho</Title>
        <Space>
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
            className="btn" 
            id="btn-detail"
            onClick={triggerFileInput}
          >
            Tải lên file Excel
          </Button>
          {fileName && <span className="ml-2 text-gray-500">{fileName}</span>}
        </Space>
      </div>

      {validationError && (
        <Alert
          message="Lỗi dữ liệu"
          description={validationError}
          type="error"
          showIcon
          className="mb-4"
          closable
        />
      )}

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
                description="Thông tin nhà cung cấp sẽ được lấy từ file Excel. Tất cả các mặt hàng phải từ cùng một nhà cung cấp."
                type="info"
                showIcon
              />
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
              <Table 
                columns={columns} 
                dataSource={data} 
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
                className="custom-table"
              />
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
