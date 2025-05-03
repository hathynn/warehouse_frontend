import React from "react";
import { Button, Space, Card, Alert, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import UseExportForm from "./UseExportForm";
import LoanExportForm from "./LoanExportForm";
import ExcelDataTable from "./ExcelDataTable";
import SelectModal from "./SelectModal";
import PropTypes from "prop-types";

const { Title } = Typography;

const ExportFormSection = ({
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
  fileName,
  setFileConfirmed,
}) => (
  <div className="container mx-auto p-5">
    {/* Back button */}
    <div className="flex items-center mb-4">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => setFileConfirmed(false)}
        className="mr-4"
      >
        Quay lại
      </Button>
    </div>

    {/* Header with file name */}
    <div className="flex justify-between items-center mb-4">
      <Title level={2}>Điền thông tin phiếu xuất</Title>
      <Space>
        <b>File đã được tải lên:</b> {fileName}
      </Space>
    </div>

    {/* Validation error */}
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
      {/* Export info form */}
      <Card title="Thông tin phiếu xuất" className="w-1/3">
        <Space direction="vertical" className="w-full">
          {formData.exportType === "PRODUCTION" ? (
            <UseExportForm
              formData={formData}
              setFormData={setFormData}
              openDepartmentModal={() => setDepartmentModalVisible(true)}
            />
          ) : (
            <LoanExportForm
              formData={formData}
              setFormData={setFormData}
              openDepartmentModal={() => setDepartmentModalVisible(true)}
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

      {/* Excel data preview remains unchanged */}
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

    {/* Department selection modal */}
    <SelectModal
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
  </div>
);

ExportFormSection.propTypes = {
  formData: PropTypes.shape({
    exportType: PropTypes.string.isRequired,
    receivingDepartment: PropTypes.object,
    departmentRepresentative: PropTypes.string,
    departmentRepresentativePhone: PropTypes.string,
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
  fileName: PropTypes.string.isRequired,
  setFileConfirmed: PropTypes.func.isRequired,
};

export default ExportFormSection;
