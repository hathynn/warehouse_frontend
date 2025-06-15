import React, { useState } from "react";
import { Button, Modal } from "antd";
import {
  CloseCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import PropTypes from "prop-types";

const EXPORT_TYPE_LABELS = {
  SELLING: "xuất bán",
  RETURN: "xuất trả nhà cung cấp",
  PRODUCTION: "xuất sản xuất",
  BORROWING: "xuất mượn",
  LIQUIDATION: "xuất thanh lý",
};

const FileUploadSection = ({
  fileName,
  exportType,
  onTriggerFileInput,
  onRemoveFile,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const handleDownloadTemplate = () => {
    let template = [];
    if (exportType === "SELLING") {
      template = [
        {
          itemId: "Mã hàng",
          quantity: "Số lượng",
        },
      ];
    } else if (exportType === "RETURN") {
      template = [
        {
          itemId: "Mã hàng",
          quantity: "Số lượng",
          providerId: "Mã Nhà cung cấp",
        },
      ];
    } else {
      template = [
        {
          itemId: "Mã hàng",
          quantity: "Số lượng",
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    //Download export request template based on type of the request
    if (exportType === "RETURN") {
      XLSX.writeFile(wb, "export_return_template.xlsx");
    } else if (exportType === "SELLING") {
      XLSX.writeFile(wb, "export_selling_template.xlsx");
    } else if (exportType === "PRODUCTION") {
      XLSX.writeFile(wb, "export_production_template.xlsx");
    } else if (exportType === "BORROWING") {
      XLSX.writeFile(wb, "export_borrowing_template.xlsx");
    } else if (exportType === "LIQUIDATION") {
      XLSX.writeFile(wb, "export_liquidation_template.xlsx");
    } else {
      XLSX.writeFile(wb, "export_request_template.xlsx");
    }
  };

  const handleRemoveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    setShowConfirmModal(false);
    if (onRemoveFile) {
      onRemoveFile();
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3 justify-center items-start">
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Tải mẫu Excel
            <span className="font-semibold">
              {EXPORT_TYPE_LABELS[exportType] || exportType}
            </span>
          </Button>

          {/* Nút tải lên file */}
          <div className="flex flex-col items-center">
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={onTriggerFileInput}
            >
              Tải lên file Excel
            </Button>
          </div>
        </div>

        {fileName && (
          <div className="flex justify-center">
            <div className="flex justify-between items-center bg-white px-3 py-2 rounded-md border border-gray-200 w-300">
              <div className="flex-1 flex justify-center items-center">
                <span className="text-gray-600 truncate" title={fileName}>
                  File đã chọn:{" "}
                  <span className="font-medium text-gray-800">{fileName}</span>
                </span>
              </div>
              <Button
                type="text"
                size="large"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleRemoveClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa file */}
      <Modal
        title="Xác nhận xóa file"
        open={showConfirmModal}
        onOk={handleConfirmRemove}
        onCancel={handleCancelRemove}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa file đã chọn?</p>
        <p>
          File đã chọn và dữ liệu xem trước sẽ bị xóa hoàn toàn đối với loại
          xuất này.
        </p>
      </Modal>
    </div>
  );
};

FileUploadSection.propTypes = {
  fileName: PropTypes.string,
  exportType: PropTypes.string,
  onTriggerFileInput: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
};

export default FileUploadSection;
