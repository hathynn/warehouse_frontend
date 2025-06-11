import React from "react";
import * as XLSX from "xlsx";
import { Button } from "antd";
import PropTypes from "prop-types";

const DownloadTemplateButton = ({ exportType }) => {
  const handleDownload = () => {
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
      // Các loại khác để sau, hiện tại default theo SELLING
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
    <Button onClick={handleDownload} type="dashed">
      Tải file mẫu
    </Button>
  );
};

DownloadTemplateButton.propTypes = {
  exportType: PropTypes.string.isRequired,
};

export default DownloadTemplateButton;
