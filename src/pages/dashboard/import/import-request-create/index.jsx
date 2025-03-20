import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Input, Select, Table, Typography, Space, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import useProviderService from "../../../../hooks/useProviderService";
import { toast } from "react-toastify";

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
    providerId: undefined,
    exportRequestId: null,
  });
  const [providers, setProviders] = useState([]);
  const fileInputRef = useRef(null);

  const {
    loading: importLoading,
    createImportRequest,
    uploadImportRequestDetail,
  } = useImportRequestService();

  const {
    loading: providerLoading,
    getAllProviders
  } = useProviderService();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersData = await getAllProviders();
        setProviders(providersData || []);
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast.error("Không thể lấy danh sách nhà cung cấp");
      }
    };

    fetchProviders();
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
        
        const transformedData = jsonData.map(item => ({
          itemId: item["itemId"] || item["Mã hàng"],
          quantity: item["quantity"] || item["Số lượng"],
        }));
        
        setData(transformedData);
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!formData.importReason || !formData.providerId) {
      toast.error("Vui lòng điền đầy đủ thông tin phiếu nhập");
      return;
    }
    
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }
    
    try {
      // Bước 1: Tạo import request
      const createdRequest = await createImportRequest(formData);
      if (createdRequest) {
        // Bước 2: Upload file Excel cho import request detail
        await uploadImportRequestDetail(file, createdRequest.importRequestId);
        
        toast.success("Tạo phiếu nhập kho thành công!");
        
        // Reset form sau khi tạo thành công
        setFormData({
          importReason: "",
          importType: "ORDER",
          providerId: undefined,
          exportRequestId: null,
        });
        setFile(null);
        setFileName("");
        setData([]);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const columns = [
    {
      title: "Mã hàng",
      dataIndex: "itemId",
      key: "itemId",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
  ];

  const loading = importLoading || providerLoading;

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo phiếu nhập kho</Title>
        <div>
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
        </div>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu nhập" className="w-1/3">
          <Space direction="vertical" className="w-full">
            <div>
              <label className="block mb-1">Lý do nhập kho</label>
              <TextArea
                placeholder="Nhập lý do"
                rows={4}
                value={formData.importReason}
                onChange={(e) => setFormData({...formData, importReason: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block mb-1">Loại nhập kho</label>
              <Select
                value={formData.importType}
                onChange={(value) => setFormData({...formData, importType: value})}
                className="w-full"
              >
                <Option value="ORDER">Mua hàng</Option>
                <Option value="RETURN">Trả hàng</Option>
              </Select>
            </div>
            
            <div>
              <label className="block mb-1">Nhà cung cấp</label>
              <Select
                placeholder="Chọn nhà cung cấp"
                value={formData.providerId}
                onChange={(value) => setFormData({...formData, providerId: value})}
                className="w-full"
              >
                {providers.map((provider) => (
                  <Option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.phone}
                  </Option>
                ))}
              </Select>
            </div>
            
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={loading}
              className="w-full mt-4"
              id="btn-detail"
            >
              Xác nhận tạo phiếu
            </Button>
          </Space>
        </Card>
        
        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            <Table 
              columns={columns} 
              dataSource={data} 
              rowKey={(record, index) => index}
              pagination={{ pageSize: 10 }}
              className="custom-table"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImportRequestCreate;
