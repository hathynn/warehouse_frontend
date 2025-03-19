import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./index.scss";
import useImportRequestService from "../../../../hooks/useImportRequestService";
import { toast } from "react-toastify";

const ImportExcel = () => {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    importReason: "",
    importType: "ORDER", // Giá trị mặc định
    providerId: "",
    exportRequestId: null,
  });

  const {
    loading,
    importRequestId,
    createImportRequest,
    uploadImportRequestDetail,
  } = useImportRequestService();

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
        
        // Chuyển đổi dữ liệu để phù hợp với định dạng backend cần
        const transformedData = jsonData.map(item => ({
          itemId: item["itemId"] || item["Mã hàng"],
          quantity: item["quantity"] || item["Số lượng"],
        }));
        
        setData(transformedData);
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    
    // Map các ID của input form sang tên trường trong API request
    const fieldMapping = {
      "ly-do": "importReason",
      "nha-cung-cap": "providerId",
    };
    
    const field = fieldMapping[id] || id;
    
    setFormData({
      ...formData,
      [field]: field === "providerId" ? parseInt(value, 10) || "" : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      if (createdRequest && createdRequest.id) {
        // Bước 2: Upload file Excel cho import request detail
        await uploadImportRequestDetail(file, createdRequest.id);
        
        toast.success("Tạo phiếu nhập kho thành công!");
        
        // Reset form sau khi tạo thành công
        setFormData({
          importReason: "",
          importType: "PURCHASE",
          providerId: "",
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

  return (
    <div className="app-container">
      <h1 id="create-report-order">Tạo phiếu nhập</h1>
      <form onSubmit={handleSubmit}>
        <div className="file-upload">
          <label htmlFor="excel-upload" className="upload-button">
            Nhập file excel
          </label>
          <input
            type="file"
            id="excel-upload"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          {fileName && <p className="file-name">{fileName}</p>}
        </div>
        <div className="main-content">
          <div className="form-container">
            <div className="input-fields">
              <div>
                <label htmlFor="ly-do" className="label">
                  Lý do nhập kho
                </label>
                <input
                  type="text"
                  id="ly-do"
                  placeholder="Nhập lý do"
                  maxLength="255"
                  className="long-input"
                  value={formData.importReason}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="input-row">
                <div className="short-input">
                  <label htmlFor="import-type" className="label">
                    Loại nhập kho
                  </label>
                  <select 
                    id="import-type" 
                    value={formData.importType}
                    onChange={(e) => setFormData({...formData, importType: e.target.value})}
                  >
                    <option value="ORDER">Mua hàng</option>
                    <option value="RETURN">Trả hàng</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="nha-cung-cap" className="label">
                  Nhà cung cấp (ID)
                </label>
                <input 
                  type="number" 
                  id="nha-cung-cap" 
                  placeholder="Nhập ID nhà cung cấp" 
                  value={formData.providerId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
          <div className="data-list">
            <table className="table-excel">
              <thead>
                <tr>
                  <th>Mã hàng (itemId)</th>
                  <th>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td>{item.itemId}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ImportExcel;
