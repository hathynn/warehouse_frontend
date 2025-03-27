import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button, Typography, Space, Card, Alert, Select } from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DEPARTMENT_ROUTER } from "@/constants/routes";
import moment from "moment";
// import SelectModal from "./SelectModal";
// import FileUploadSection from "./FileUploadSection";
// import ExcelDataTable from "./ExcelDataTable";
// import ReturnExportForm from "./ReturnExportForm";
// import UseExportForm from "./UseExportForm";
// import LoanExportForm from "./LoanExportForm";
import { UploadOutlined } from "@ant-design/icons";
import FileUploadSection from "@/components/export-flow/FileUploadSection";
import ReturnExportForm from "@/components/export-flow/ReturnExportForm";
import UseExportForm from "@/components/export-flow/UseExportForm";
import LoanExportForm from "@/components/export-flow/LoanExportForm";
import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
import SelectModal from "@/components/export-flow/SelectModal";

const { Title } = Typography;
const { Option } = Select;

const ExportRequestCreate = () => {
  // State cho file Excel và form data
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    exportType: "RETURN", // RETURN, USE, LOAN
    exportDate: null,
    // RETURN fields
    supplierReceiver: null,
    returnManager: null,
    importReference: null,
    returnReason: "",
    // USE fields
    receivingDepartment: null,
    receivingManager: "",
    productionOrder: "",
    usagePurpose: "",
    // LOAN fields
    borrower: "",
    loanManager: null,
    loanExpiry: null,
    loanReason: "",
    // common
    note: "",
  });

  // Hardcoded data cho các modal
  const suppliers = [
    { id: 1, name: "Nhà cung cấp A" },
    { id: 2, name: "Nhà cung cấp B" },
    { id: 3, name: "Nhà cung cấp C" },
  ];
  const managers = [
    { id: 1, name: "Người phụ trách A" },
    { id: 2, name: "Người phụ trách B" },
    { id: 3, name: "Người phụ trách C" },
  ];
  const importReferences = [
    { id: 1, name: "Phiếu nhập #1001" },
    { id: 2, name: "Phiếu nhập #1002" },
    { id: 3, name: "Phiếu nhập #1003" },
  ];
  const departments = [
    { id: 1, name: "Bộ phận A" },
    { id: 2, name: "Phân xưởng B" },
    { id: 3, name: "Bộ phận C" },
  ];

  // State cho các modal
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [returnManagerModalVisible, setReturnManagerModalVisible] =
    useState(false);
  const [importReferenceModalVisible, setImportReferenceModalVisible] =
    useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [loanManagerModalVisible, setLoanManagerModalVisible] = useState(false);

  // File upload handlers
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
        try {
          const transformedData = jsonData.map((item, index) => {
            const itemId = item["itemId"] || item["Mã hàng"];
            const quantity = item["quantity"] || item["Số lượng"];
            if (!itemId || !quantity) {
              throw new Error(
                `Dòng ${index + 1}: Thiếu thông tin Mã hàng hoặc Số lượng`
              );
            }
            return {
              itemId: Number(itemId),
              quantity: Number(quantity),
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

  // Download template Excel
  const downloadTemplate = () => {
    const template = [{ itemId: "Mã hàng (số)", quantity: "Số lượng (số)" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "export_request_template.xlsx");
  };

  const handleSubmit = async () => {
    if (!formData.exportDate) {
      toast.error("Vui lòng chọn ngày xuất");
      return;
    }
    if (formData.exportType === "RETURN") {
      if (
        !formData.supplierReceiver ||
        !formData.returnManager ||
        !formData.importReference ||
        !formData.returnReason
      ) {
        toast.error(
          "Vui lòng điền đầy đủ thông tin cho phiếu xuất trả nhà cung cấp"
        );
        return;
      }
    } else if (formData.exportType === "USE") {
      if (
        !formData.receivingDepartment ||
        !formData.receivingManager ||
        !formData.usagePurpose
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất sử dụng");
        return;
      }
    } else if (formData.exportType === "LOAN") {
      if (
        !formData.loanManager ||
        !formData.borrower ||
        !formData.loanExpiry ||
        !formData.loanReason
      ) {
        toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất mượn");
        return;
      }
    }
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Tạo phiếu xuất thành công!");
      navigate(DEPARTMENT_ROUTER.EXPORT.REQUEST.LIST);
      // Reset form
      setFormData({
        exportType: "RETURN",
        exportDate: null,
        supplierReceiver: null,
        returnManager: null,
        importReference: null,
        returnReason: "",
        receivingDepartment: null,
        receivingManager: "",
        productionOrder: "",
        usagePurpose: "",
        borrower: "",
        loanManager: null,
        loanExpiry: null,
        loanReason: "",
        note: "",
      });
      setFile(null);
      setFileName("");
      setData([]);
    } catch (error) {
      console.error("Error creating export request:", error);
      toast.error("Có lỗi xảy ra khi tạo phiếu xuất");
    }
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Tạo phiếu xuất</Title>
        <Space>
          <FileUploadSection
            fileName={fileName}
            onDownloadTemplate={downloadTemplate}
            onTriggerFileInput={triggerFileInput}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
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

      <div className="mb-4">
        <Space direction="horizontal">
          <span className="font-semibold">Loại phiếu xuất: </span>
          <Select
            value={formData.exportType}
            onChange={(value) =>
              setFormData({ ...formData, exportType: value })
            }
            style={{ width: 300 }}
          >
            <Option value="RETURN">Xuất trả nhà cung cấp</Option>
            <Option value="USE">Xuất sử dụng (nội bộ, sản xuất)</Option>
            <Option value="LOAN">Xuất mượn</Option>
          </Select>
        </Space>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu xuất" className="w-1/3">
          <Space direction="vertical" className="w-full">
            {formData.exportType === "RETURN" && (
              <ReturnExportForm
                formData={formData}
                setFormData={setFormData}
                openSupplierModal={() => setSupplierModalVisible(true)}
                openReturnManagerModal={() =>
                  setReturnManagerModalVisible(true)
                }
                openImportReferenceModal={() =>
                  setImportReferenceModalVisible(true)
                }
              />
            )}
            {formData.exportType === "USE" && (
              <UseExportForm
                formData={formData}
                setFormData={setFormData}
                openDepartmentModal={() => setDepartmentModalVisible(true)}
              />
            )}
            {formData.exportType === "LOAN" && (
              <LoanExportForm
                formData={formData}
                setFormData={setFormData}
                openLoanManagerModal={() => setLoanManagerModalVisible(true)}
              />
            )}
            <Button
              type="primary"
              onClick={handleSubmit}
              className="w-full mt-4"
              disabled={data.length === 0 || !!validationError}
            >
              Xác nhận tạo phiếu xuất
            </Button>
          </Space>
        </Card>

        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            {data.length > 0 ? (
              <ExcelDataTable data={data} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Các modal chọn lựa */}
      <SelectModal
        visible={supplierModalVisible}
        title="Chọn nhà cung cấp"
        data={suppliers}
        onSelect={(item) => {
          setFormData({ ...formData, supplierReceiver: item });
          setSupplierModalVisible(false);
        }}
        onCancel={() => setSupplierModalVisible(false)}
      />

      <SelectModal
        visible={returnManagerModalVisible}
        title="Chọn người phụ trách trả hàng"
        data={managers}
        onSelect={(item) => {
          setFormData({ ...formData, returnManager: item });
          setReturnManagerModalVisible(false);
        }}
        onCancel={() => setReturnManagerModalVisible(false)}
      />

      <SelectModal
        visible={importReferenceModalVisible}
        title="Chọn phiếu nhập tham chiếu"
        data={importReferences}
        onSelect={(item) => {
          setFormData({ ...formData, importReference: item });
          setImportReferenceModalVisible(false);
        }}
        onCancel={() => setImportReferenceModalVisible(false)}
      />

      <SelectModal
        visible={departmentModalVisible}
        title="Chọn bộ phận/phân xưởng"
        data={departments}
        onSelect={(item) => {
          setFormData({ ...formData, receivingDepartment: item });
          setDepartmentModalVisible(false);
        }}
        onCancel={() => setDepartmentModalVisible(false)}
      />

      <SelectModal
        visible={loanManagerModalVisible}
        title="Chọn người phụ trách"
        data={managers}
        onSelect={(item) => {
          setFormData({ ...formData, loanManager: item });
          setLoanManagerModalVisible(false);
        }}
        onCancel={() => setLoanManagerModalVisible(false)}
      />
    </div>
  );
};

export default ExportRequestCreate;
