import React, { useState } from "react";
import { Button, Space, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import UseExportForm from "@/components/export-flow/export-create/UseExportForm";
import LoanExportForm from "@/components/export-flow/export-create/LoanExportForm";
import ExcelDataTableAfter from "./ExcelDataTableAfter";
import PropTypes from "prop-types";
import ExportRequestConfirmModal from "../export-general/ExportRequestConfirmModal";
import DeparmentModal from "./DeparmentModal";
import SellingExportForm from "@/components/export-flow/export-create/SellingExportForm";

const { Title } = Typography;

const ExportRequestInfoForm = ({
  formData,
  setFormData,
  data,
  mappedData,
  validationError,
  handleSubmit,
  departmentModalVisible,
  setDepartmentModalVisible,
  departments,
  fakeFetchDepartmentDetails,
  setFileConfirmed,
  fileName,
  // ---- thêm các prop này nếu cần
  exportType, // NEW
  items, // NEW
  providers, // NEW
  pagination, // NEW (optional)
}) => {
  const [timeError, setTimeError] = useState("");
  const [mandatoryError, setMandatoryError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const missingFields =
    (formData.exportType === "PRODUCTION" &&
      (!formData.exportDate ||
        !formData.exportTime ||
        !formData.exportReason ||
        !formData.receivingDepartment)) ||
    (formData.exportType === "BORROWING" &&
      (!formData.exportDate ||
        !formData.exportTime ||
        !formData.exportReason ||
        !formData.receivingDepartment)) ||
    (formData.exportType === "SELLING" &&
      (!formData.exportDate ||
        !formData.exportReason ||
        !formData.receiverName ||
        !formData.receiverPhone));

  const onSubmit = () => {
    if (missingFields) {
      setMandatoryError("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    setMandatoryError("");
    setShowConfirmModal(true);
  };

  const handleConfirmModalOk = async () => {
    setConfirmLoading(true);
    await handleSubmit();
    setConfirmLoading(false);
    setShowConfirmModal(false);
  };

  return (
    <div className="container mx-auto p-5">
      <div className="flex items-center mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => setFileConfirmed(false)}
          className="mr-4"
        >
          Quay lại
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Title level={2}>Điền thông tin phiếu xuất</Title>
        <Space>
          <b>File đã được tải lên:</b> {fileName}
        </Space>
      </div>

      <div className="flex gap-6">
        <Card title="Thông tin phiếu xuất" className="w-1/3">
          <Space direction="vertical" className="w-full">
            {formData.exportType === "PRODUCTION" && (
              <UseExportForm
                formData={formData}
                setFormData={setFormData}
                openDepartmentModal={() => setDepartmentModalVisible(true)}
                timeError={timeError}
                setTimeError={setTimeError}
                mandatoryError={mandatoryError}
                setMandatoryError={setMandatoryError}
              />
            )}
            {formData.exportType === "BORROWING" && (
              <LoanExportForm
                formData={formData}
                setFormData={setFormData}
                openDepartmentModal={() => setDepartmentModalVisible(true)}
                timeError={timeError}
                setTimeError={setTimeError}
                mandatoryError={mandatoryError}
                setMandatoryError={setMandatoryError}
              />
            )}
            {formData.exportType === "SELLING" && (
              <SellingExportForm
                formData={formData}
                setFormData={setFormData}
                timeError={timeError}
                setTimeError={setTimeError}
                mandatoryError={mandatoryError}
                setMandatoryError={setMandatoryError}
              />
            )}
            {mandatoryError && (
              <div className="text-red-500 text-sm mb-2">{mandatoryError}</div>
            )}
            <Button
              type="primary"
              onClick={onSubmit}
              className="w-full mt-4"
              disabled={
                data.length === 0 ||
                !!validationError ||
                !!timeError ||
                missingFields
              }
            >
              Xác nhận tạo phiếu xuất
            </Button>
          </Space>
        </Card>

        <div className="w-2/3">
          <Card title="Chi tiết hàng hóa từ file Excel">
            {mappedData.length > 0 ? (
              <ExcelDataTableAfter
                data={mappedData}
                exportType={formData.exportType} // truyền exportType
                items={items} // truyền items nếu cần
                providers={providers} // truyền providers nếu cần
                pagination={pagination} // truyền pagination nếu dùng phân trang
              />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Vui lòng tải lên file Excel để xem chi tiết hàng hóa
              </div>
            )}
          </Card>
        </div>
      </div>

      <DeparmentModal
        visible={departmentModalVisible}
        title="Chọn bộ phận/phân xưởng"
        data={departments}
        onSelect={async (selectedDepartment) => {
          const details = await fakeFetchDepartmentDetails(selectedDepartment);
          setFormData({
            ...formData,
            receivingDepartment: selectedDepartment,
            departmentRepresentative: details?.receiverName || "",
            departmentRepresentativePhone: details?.receiverPhone || "",
          });
          setDepartmentModalVisible(false);
        }}
        onCancel={() => setDepartmentModalVisible(false)}
      />

      <ExportRequestConfirmModal
        open={showConfirmModal}
        onOk={handleConfirmModalOk}
        onCancel={() => setShowConfirmModal(false)}
        confirmLoading={confirmLoading}
        formData={formData}
        details={mappedData}
      />
    </div>
  );
};

ExportRequestInfoForm.propTypes = {
  formData: PropTypes.shape({
    exportType: PropTypes.string.isRequired,
    exportDate: PropTypes.string.isRequired,
    exportTime: PropTypes.string.isRequired,
    exportReason: PropTypes.string.isRequired,
    receivingDepartment: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }).isRequired,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
    receiverName: PropTypes.string,
    receiverPhone: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  mappedData: PropTypes.array.isRequired,
  validationError: PropTypes.string,
  handleSubmit: PropTypes.func.isRequired,
  departmentModalVisible: PropTypes.bool.isRequired,
  setDepartmentModalVisible: PropTypes.func.isRequired,
  departments: PropTypes.array.isRequired,
  fakeFetchDepartmentDetails: PropTypes.func.isRequired,
  setFileConfirmed: PropTypes.func.isRequired,
  fileName: PropTypes.string.isRequired,
};

export default ExportRequestInfoForm;
