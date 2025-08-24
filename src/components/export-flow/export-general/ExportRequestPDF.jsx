import React, { useState, useEffect } from "react";
import { Modal, Button, Spin, message } from "antd";
import { FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import usePaperService from "@/services/usePaperService";

const ExportRequestPDF = ({
  visible,
  onCancel,
  exportRequest,
  exportRequestDetails,
  departmentInfo,
  assignedKeeper,
  providerInfo,
  items,
}) => {
  //data hooks
  const [loading, setLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [paperData, setPaperData] = useState(null);
  const [paperLoading, setPaperLoading] = useState(false);

  //service hooks
  const { getPapersByExportRequestId } = usePaperService();

  const fetchPaperData = async () => {
    if (!exportRequest?.exportRequestId) {
      setPaperData({});
      return;
    }

    setPaperLoading(true);
    try {
      const response = await getPapersByExportRequestId(
        exportRequest.exportRequestId,
        1,
        10
      );
      if (response?.content && response.content.length > 0) {
        setPaperData(response.content[0]);
      } else {
        setPaperData({});
      }
    } catch (error) {
      console.error("Error fetching paper data:", error);
      setPaperData({});
    } finally {
      setPaperLoading(false);
    }
  };

  // Enrich details with item metadata
  const enrichDetailsWithItems = (details, itemsData) => {
    return details.map((detail) => {
      const itemInfo = itemsData.find(
        (item) => String(item.id) === String(detail.itemId)
      );
      return {
        ...detail,
        itemName: itemInfo?.name || detail.itemName || "Không xác định",
        unitType: itemInfo?.unitType || "",
        measurementUnit: itemInfo?.measurementUnit || "",
      };
    });
  };

  const getExportTypeText = (type) => {
    if (type === "INTERNAL") return "Xuất nội bộ";
    else if (type === "SELLING") return "Xuất bán";
    else if (type === "RETURN") return "Xuất trả nhà cung cấp";
    else if (type === "LIQUIDATION") return "Xuất thanh lý";
    return "";
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const enrichedDetails = enrichDetailsWithItems(
        exportRequestDetails,
        items
      );

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 13px;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 0;
              padding-left: 15px; 
              padding-right: 15px;
              padding-top: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              margin: 15px 0;
              text-transform: uppercase;
            }
            .export-id {
              font-size: 16px;
              font-weight: bold;
              color: #1890ff;
            }
            .info-section {
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
              align-items: flex-start;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            .table th,
            .table td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            .table th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: center;
            }
            .table-center {
              text-align: center;
            }
            .status-tag {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            .status-completed {
              background-color: #f6ffed;
              color: #52c41a;
              border: 1px solid #52c41a;
            }
            .status-match {
              background-color: #f6ffed;
              color: #52c41a;
              border: 1px solid #52c41a;
            }
            .status-lack {
              background-color: #fff2f0;
              color: #ff4d4f;
              border: 1px solid #ff4d4f;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-title {
              font-weight: bold;
              margin-bottom: 50px;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 50px;
              padding-top: 5px;
              font-style: italic;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            .break-word {
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">CÔNG TY CỔ PHẦN CẮT MAY SOFA HOA SEN</div>
            <div>Địa chỉ: Long Đức, Trà Vinh</div>
            <div>Tel: (028) 1234 5678 | Email: info@abc.com</div>
            
            <div class="document-title">Phiếu Xuất Kho</div>
            <div class="export-id">Số: ${
              exportRequest?.exportRequestId || ""
            }</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Loại phiếu xuất:</span>
              <span class="info-value">${getExportTypeText(
                exportRequest?.type
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày tạo phiếu:</span>
              <span class="info-value">${
                exportRequest?.createdDate
                  ? dayjs(exportRequest.createdDate).format("DD/MM/YYYY HH:mm")
                  : "-"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày xuất:</span>
              <span class="info-value">${
                exportRequest?.exportDate
                  ? dayjs(exportRequest.exportDate).format("DD/MM/YYYY")
                  : "-"
              }</span>
            </div>
            ${
              exportRequest?.type === "INTERNAL"
                ? `
            <div class="info-row">
              <span class="info-label">Bộ phận nhận:</span>
              <span class="info-value">${
                departmentInfo?.departmentName || "-"
              }</span>
            </div>
            `
                : ""
            }
            ${
              exportRequest?.type === "RETURN"
                ? `
            <div class="info-row">
              <span class="info-label">Nhà cung cấp:</span>
              <span class="info-value">${providerInfo?.name || "-"}</span>
            </div>
            `
                : ""
            }
            <div class="info-row">
              <span class="info-label">Người nhận hàng:</span>
              <span class="info-value">${
                exportRequest?.receiverName || "-"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">SĐT người nhận:</span>
              <span class="info-value">${
                exportRequest?.receiverPhone || "-"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Lý do xuất:</span>
              <span class="info-value break-word">${
                exportRequest?.exportReason || "-"
              }</span>
            </div>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="margin-bottom: 15px; font-size: 16px; font-weight: bold;">Danh sách sản phẩm đã xuất</h3>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 8%">STT</th>
                  <th style="width: 15%">Mã sản phẩm</th>
                  <th style="width: 25%">Tên sản phẩm</th>
                  ${
                    exportRequest?.type === "INTERNAL"
                      ? `
                  <th style="width: 15%">Giá trị xuất<br/>(${
                    enrichedDetails[0]?.measurementUnit || "đơn vị"
                  })</th>
                  `
                      : `
                  `
                  }
                  <th style="width: 15%">Số lượng xuất<br/>(${
                    enrichedDetails[0]?.unitType || "đơn vị"
                  })</th>
                </tr>
              </thead>
              <tbody>
                ${enrichedDetails
                  .map(
                    (detail, index) => `
                <tr>
                  <td class="table-center">${index + 1}</td>
                  <td class="table-center">${detail.itemId}</td>
                  <td>${detail.itemName}</td>
                  ${
                    exportRequest?.type === "INTERNAL"
                      ? `
                  <td class="table-center">${detail.actualMeasurementValue}</td>
                  `
                      : `
                  `
                  }
                  <td class="table-center">${detail.actualQuantity}</td>
                </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

        <div class="signature-section" style="padding-left: 40px; padding-right: 40px;">
            <div class="signature-box">
                <div class="signature-title">Người xuất hàng</div>
                ${
                  paperData?.signProviderUrl
                    ? `
                <div style="margin: 20px 0; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                <img src="${paperData.signProviderUrl}" 
                    alt="Chữ ký người xuất" 
                    style="max-width: 150px; max-height: 80px; object-fit: contain;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; font-weight: bold; font-style: italic;">(Đã ký)</div>
                </div>
                `
                    : `
                <div style="height: 80px; margin: 20px 0; display: flex; align-items: center; justify-content: center;">
                <span style="font-weight: bold; font-style: italic;">(Đã ký)</span>
                </div>
                `
                }
                <div class="signature-line">${
                  paperData?.signProviderName || assignedKeeper?.fullName || ""
                }</div>
            </div>
            <div class="signature-box">
                <div class="signature-title">Người nhận hàng</div>
                ${
                  paperData?.signReceiverUrl
                    ? `
                <div style="margin: 20px 0; min-height: 80px; display: flex; align-items: center; justify-content: center;">
                <img src="${paperData.signReceiverUrl}" 
                    alt="Chữ ký người nhận" 
                    style="max-width: 150px; max-height: 80px; object-fit: contain;"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; font-weight: bold; font-style: italic;">(Đã ký)</div>
                </div>
                `
                    : `
                <div style="height: 80px; margin: 20px 0; display: flex; align-items: center; justify-content: center;">
                <span style="font-weight: bold; font-style: italic;">(Đã ký)</span>
                </div>
                `
                }
                <div class="signature-line">${
                  paperData?.signReceiverName ||
                  exportRequest?.receiverName ||
                  ""
                }</div>
            </div>
        </div>

          <div class="footer">
            <p>Phiếu xuất được tạo tự động vào ${dayjs().format(
              "DD/MM/YYYY HH:mm:ss"
            )}</p>
            <p>© Hệ thống quản lý kho - Công ty cổ phần cắt may sofa HOA SEN</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and generate PDF preview
      const blob = new Blob([htmlContent], { type: "text/html" });
      setPdfBlob(blob);
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Không thể tạo file PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Phieu_Xuat_${
      exportRequest?.exportRequestId || "Unknown"
    }.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("Đã tải xuống file PDF");
  };

  const handlePrint = () => {
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, "_blank");

    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    } else {
      message.error("Không thể mở cửa sổ in");
    }

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (visible && exportRequest && exportRequestDetails.length > 0) {
      fetchPaperData();
    }

    return () => {
      if (pdfBlob) {
        URL.revokeObjectURL(URL.createObjectURL(pdfBlob));
      }
    };
  }, [visible, exportRequest, exportRequestDetails]);

  // useEffect riêng để generate PDF khi paperData thay đổi
  useEffect(() => {
    if (
      visible &&
      exportRequest &&
      exportRequestDetails.length > 0 &&
      paperData !== null &&
      !paperLoading
    ) {
      generatePDF();
    }
  }, [paperData, paperLoading, visible, exportRequest, exportRequestDetails]);

  return (
    <Modal
      open={visible}
      onCancel={() => {
        setPdfBlob(null);
        setPaperData(null); // Reset paperData
        onCancel();
      }}
      title={
        <span style={{ fontWeight: 700, fontSize: "18px" }}>
          <FileTextOutlined className="mr-2" />
          Xem trước phiếu xuất PDF
        </span>
      }
      width="60%"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="download"
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={!pdfBlob || loading || paperLoading}
        >
          Tải xuống
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={handlePrint}
          disabled={!pdfBlob || loading || paperLoading}
        >
          In phiếu
        </Button>,
      ]}
    >
      <div style={{ height: "75vh", overflow: "hidden" }}>
        {loading || paperLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
            <span className="ml-3">
              {paperLoading
                ? "Đang tải thông tin chữ ký..."
                : "Đang tạo file PDF..."}
            </span>
          </div>
        ) : pdfBlob ? (
          <iframe
            src={URL.createObjectURL(pdfBlob)}
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
            }}
            title="PDF Preview"
          />
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">
            Không thể tạo file PDF
          </div>
        )}
      </div>
    </Modal>
  );
};

ExportRequestPDF.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  exportRequest: PropTypes.shape({
    exportRequestId: PropTypes.string,
    exportReason: PropTypes.string,
    receiverName: PropTypes.string,
    receiverPhone: PropTypes.string,
    receiverAddress: PropTypes.string,
    departmentId: PropTypes.number,
    providerId: PropTypes.number,
    status: PropTypes.string,
    type: PropTypes.string,
    exportDate: PropTypes.string,
    createdBy: PropTypes.string,
    createdDate: PropTypes.string,
    updatedDate: PropTypes.string,
  }),
  exportRequestDetails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      measurementValue: PropTypes.number,
      actualQuantity: PropTypes.number,
      actualMeasurementValue: PropTypes.number,
      quantity: PropTypes.number,
      status: PropTypes.string,
      exportRequestId: PropTypes.string,
      itemId: PropTypes.string,
      inventoryItemIds: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  departmentInfo: PropTypes.shape({
    departmentName: PropTypes.string,
  }),
  assignedStaff: PropTypes.shape({
    fullName: PropTypes.string,
  }),
  assignedKeeper: PropTypes.shape({
    fullName: PropTypes.string,
  }),
  providerInfo: PropTypes.shape({
    name: PropTypes.string,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      unitType: PropTypes.string,
      measurementUnit: PropTypes.string,
    })
  ),
};

ExportRequestPDF.defaultProps = {
  exportRequest: null,
  exportRequestDetails: [],
  departmentInfo: null,
  assignedStaff: null,
  assignedKeeper: null,
  providerInfo: null,
  items: [],
};

export default ExportRequestPDF;
