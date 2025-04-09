import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Typography,
  Space,
  Card,
  Alert,
  Select,
  Input,
  Modal,
  Table,
} from "antd";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { DEPARTMENT_ROUTER } from "@/constants/routes";
import moment from "moment";
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import FileUploadSection from "@/components/export-flow/FileUploadSection";
import ReturnExportForm from "@/components/export-flow/ReturnExportForm";
import UseExportForm from "@/components/export-flow/UseExportForm";
import LoanExportForm from "@/components/export-flow/LoanExportForm";
import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
import SelectModal from "@/components/export-flow/SelectModal";
import useRoleService from "../../../../hooks/useRoleService";
import useItemService from "../../../../hooks/useItemService";
import useExportRequestService from "../../../../hooks/useExportRequestService";
import useExportRequestDetailService from "../../../../hooks/useExportRequestDetailService";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ExportRequestCreate = () => {
  // --- State file và form ---
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // --- State cho danh sách sản phẩm (để mapping itemName) ---
  const [items, setItems] = useState([]);
  const { loading: itemLoading, getItems } = useItemService();
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsData = await getItems();
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching items:", error);
        toast.error("Không thể lấy danh sách sản phẩm");
      }
    };
    fetchItems();
  }, []);

  // --- Form data cho export request ---
  const [formData, setFormData] = useState({
    exportType: "USE", // Mặc định là USE
    exportDate: moment().format("YYYY-MM-DD"),
    exportTime: moment().format("HH:mm:ss"),
    exportReason: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    assignedWareHouseKeeper: null, // Lưu đối tượng Warehouse Keeper
    note: "",
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
  });

  // --- Dữ liệu cứng cho các modal ---
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

  // --- State cho các modal lựa chọn khác ---
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [returnManagerModalVisible, setReturnManagerModalVisible] =
    useState(false);
  const [importReferenceModalVisible, setImportReferenceModalVisible] =
    useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [loanManagerModalVisible, setLoanManagerModalVisible] = useState(false);

  // --- State cho modal Warehouse Keeper ---
  const [warehouseKeepers, setWarehouseKeepers] = useState([]);
  const [warehouseKeeperModalVisible, setWarehouseKeeperModalVisible] =
    useState(false);
  const [warehouseKeeperSearch, setWarehouseKeeperSearch] = useState("");

  const { getAccountsByRole } = useRoleService();
  const fetchWarehouseKeepers = async () => {
    try {
      const accounts = await getAccountsByRole({ role: "WAREHOUSE_KEEPER" });
      setWarehouseKeepers(accounts);
    } catch (error) {
      console.error("Error fetching warehouse keepers:", error);
    }
  };
  const openWarehouseKeeperModal = () => {
    fetchWarehouseKeepers();
    setWarehouseKeeperSearch("");
    setWarehouseKeeperModalVisible(true);
  };
  const handleWarehouseKeeperSelect = (wk) => {
    setFormData({ ...formData, assignedWareHouseKeeper: wk });
    setWarehouseKeeperModalVisible(false);
  };
  const filteredWarehouseKeepers = warehouseKeepers.filter(
    (wk) =>
      wk.fullName.toLowerCase().includes(warehouseKeeperSearch.toLowerCase()) ||
      wk.email.toLowerCase().includes(warehouseKeeperSearch.toLowerCase())
  );

  // --- File upload handlers ---
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
                `Dòng ${index + 1}: Thiếu thông tin itemId hoặc quantity`
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
  const downloadTemplate = () => {
    const template = [{ itemId: "Mã hàng (số)", quantity: "Số lượng (số)" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "export_request_template.xlsx");
  };

  // --- API hooks cho Export Request & Detail ---
  const { createExportRequest } = useExportRequestService();
  const { createExportRequestDetail } = useExportRequestDetailService();

  // ----- Submit handler: Gọi API tạo export request và export request detail -----
  const handleSubmit = async () => {
    // Validate các trường bắt buộc cho loại USE
    if (
      !formData.exportReason ||
      !formData.receiverName ||
      !formData.receiverPhone ||
      !formData.receiverAddress ||
      !formData.exportDate ||
      !formData.exportTime
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin cho phiếu xuất sử dụng");
      return;
    }
    if (!file || data.length === 0) {
      toast.error("Vui lòng tải lên file Excel với dữ liệu hợp lệ");
      return;
    }
    try {
      // Bước 1: Tạo export request
      const payload = {
        exportReason: formData.exportReason,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        receiverAddress: formData.receiverAddress,
        type: formData.exportType, // "USE"
        exportDate: formData.exportDate,
        exportTime: formData.exportTime,
        assignedWarehouseKeeperId: formData.assignedWareHouseKeeper
          ? formData.assignedWareHouseKeeper.id
          : null,
      };
      const createdExport = await createExportRequest(payload);
      if (!createdExport) {
        throw new Error("Không tạo được phiếu xuất");
      }

      // Bước 2: Tạo export request detail (upload file Excel)
      const fd = new FormData();
      fd.append("file", file);
      // Gọi API tạo export request detail với exportRequestId và FormData chứa file
      await createExportRequestDetail(fd, createdExport.exportRequestId);

      toast.success("Tạo phiếu xuất thành công!");
      navigate(DEPARTMENT_ROUTER.EXPORT.REQUEST.LIST);

      // Reset state sau khi tạo thành công
      setFormData({
        exportType: "USE",
        exportDate: moment().format("YYYY-MM-DD"),
        exportTime: moment().format("HH:mm:ss"),
        exportReason: "",
        receiverName: "",
        receiverPhone: "",
        receiverAddress: "",
        assignedWareHouseKeeper: null,
        note: "",
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
      });
      setFile(null);
      setFileName("");
      setData([]);
    } catch (error) {
      console.error("Error creating export request:", error);
      toast.error("Có lỗi xảy ra khi tạo phiếu xuất");
    }
  };

  // --- Các cột hiển thị trong bảng Excel (3 cột: itemId, itemName, quantity) ---
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
  ];

  // Dữ liệu được mapping: thêm itemName từ danh sách sản phẩm (items) dựa vào itemId
  const mappedData = data.map((row) => {
    const foundItem = items.find((i) => i.id === row.itemId);
    return {
      ...row,
      itemName: foundItem ? foundItem.name : "Không xác định",
    };
  });

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
                openWarehouseKeeperModal={openWarehouseKeeperModal}
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
            {mappedData.length > 0 ? (
              <ExcelDataTable data={mappedData} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Warehouse Keeper */}
      <Modal
        title="Chọn Warehouse Keeper"
        visible={warehouseKeeperModalVisible}
        onCancel={() => setWarehouseKeeperModalVisible(false)}
        footer={null}
      >
        <Input
          placeholder="Tìm kiếm theo tên hoặc email"
          value={warehouseKeeperSearch}
          onChange={(e) => setWarehouseKeeperSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        {filteredWarehouseKeepers.map((wk) => (
          <div
            key={wk.id}
            className="cursor-pointer p-2 hover:bg-gray-100 border-b"
            onClick={() => handleWarehouseKeeperSelect(wk)}
          >
            <div className="font-semibold">{wk.fullName}</div>
            <div className="text-sm text-gray-500">{wk.email}</div>
          </div>
        ))}
      </Modal>

      {/* Các modal lựa chọn khác (nếu cần) */}
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
