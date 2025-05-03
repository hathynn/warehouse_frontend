// ExportRequestInfoForm.jsx
import React from "react";
import { Button, Space, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import UseExportForm from "@/components/export-flow/UseExportForm";
import LoanExportForm from "@/components/export-flow/LoanExportForm";
import ExcelDataTable from "@/components/export-flow/ExcelDataTable";
import SelectModal from "@/components/export-flow/SelectModal";
import { Typography } from "antd";

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
}) => (
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
            />
          )}
          {formData.exportType === "LOAN" && (
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

import PropTypes from "prop-types";

ExportRequestInfoForm.propTypes = {
  formData: PropTypes.shape({
    exportType: PropTypes.string.isRequired,
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
