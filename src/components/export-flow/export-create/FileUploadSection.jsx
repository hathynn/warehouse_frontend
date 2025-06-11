import React from "react";
import { Button } from "antd";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
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
  onDownloadTemplate,
  exportType,
  onTriggerFileInput,
}) => {
  const handleDownloadTemplate = () => {
    let template = [];
    if (exportType === "SELLING") {
      template = [
        {
          itemId: "Mã hàng (số)",
          quantity: "Số lượng (số)",
        },
      ];
    } else if (exportType === "RETURN") {
      template = [
        {
          itemId: "Mã hàng (số)",
          quantity: "Số lượng (số)",
          providerId: "Mã Nhà cung cấp (số)",
        },
      ];
    } else {
      template = [
        {
          itemId: "Mã hàng (số)",
          quantity: "Số lượng (số)",
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "export_request_template.xlsx");
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
          <div className="flex justify-center items-center bg-white px-3 py-2 rounded-md border border-gray-200">
            <span className="text-gray-600 truncate" title={fileName}>
              File đã chọn:{" "}
              <span className="font-medium text-gray-800">{fileName}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

FileUploadSection.propTypes = {
  fileName: PropTypes.string,
  onDownloadTemplate: PropTypes.func.isRequired,
  exportType: PropTypes.string,
  onTriggerFileInput: PropTypes.func.isRequired,
};

export default FileUploadSection;
