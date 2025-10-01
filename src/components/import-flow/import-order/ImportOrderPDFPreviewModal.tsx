import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Button, Spin, message } from "antd";
import { FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import usePaperService, { PaperResponse } from "@/services/usePaperService";
import { ImportOrderResponse } from "@/services/useImportOrderService";
import { ImportOrderDetailResponse } from "@/services/useImportOrderDetailService";
import { ImportRequestResponse } from "@/services/useImportRequestService";
import { ProviderResponse } from "@/services/useProviderService";
import { AccountResponse } from "@/services/useAccountService";
import { ItemResponse } from "@/services/useItemService";

interface ImportOrderPDFPreviewModalProps {
  visible: boolean;
  onCancel: () => void;
  importOrder: ImportOrderResponse | null;
  importOrderDetails: ImportOrderDetailResponse[];
  importRequest?: ImportRequestResponse | null;
  assignedStaff?: AccountResponse | null;
  providerInfo?: ProviderResponse | null;
  itemsData: ItemResponse[];
}

const ImportOrderPDFPreviewModal: React.FC<ImportOrderPDFPreviewModalProps> = ({
  visible,
  onCancel,
  importOrder,
  importOrderDetails,
  importRequest,
  assignedStaff,
  providerInfo,
  itemsData,
}) => {
  const [loading, setLoading] = useState(false);
  const [paperLoading, setPaperLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [paperData, setPaperData] = useState<PaperResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { getPapersByImportOrderId } = usePaperService();

  const isReturnImport = useMemo(() => {
    const type = importOrder?.importType || importRequest?.importType;
    return type === "RETURN";
  }, [importOrder?.importType, importRequest?.importType]);

  const escapeHtml = (
    value: string | number | null | undefined,
    fallback = "-"
  ) => {
    if (value === null || value === undefined) {
      return fallback;
    }
    const str = String(value);
    if (!str.trim()) {
      return fallback;
    }
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return "0";
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      return "0";
    }
    return num.toLocaleString("vi-VN");
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "-";
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const parts = value.split(":");
    if (parts.length < 2) return value;
    return `${parts[0]}:${parts[1]}`;
  };

  const getImportTypeText = (type?: string | null) => {
    if (type === "RETURN") return "Nhập trả hàng";
    if (type === "ORDER") return "Nhập hàng";
    return "-";
  };

  const findItemMeta = (detail: ImportOrderDetailResponse) => {
    const byId = itemsData.find(
      (item) => String(item.id) === String(detail.itemId)
    );
    if (byId) return byId;
    return itemsData.find((item) =>
      item.inventoryItemIds?.includes(String(detail.inventoryItemId))
    );
  };

  const formatQuantityBlock = (
    quantity: number | null | undefined,
    unitType?: string | null,
    measurementValue?: number | null | undefined,
    measurementUnit?: string | null,
    includeMeasurement = true
  ) => {
    const unit = escapeHtml(unitType ?? "", "");
    const main = `${formatNumber(quantity)}${unit ? ` ${unit}` : ""}`;
    let measurementLine = "";
    if (includeMeasurement && measurementUnit) {
      const measurement = escapeHtml(measurementUnit, "");
      const measurementValueText = formatNumber(measurementValue);
      const combined = `${measurementValueText} ${measurement}`.trim();
      measurementLine = escapeHtml(combined, "");
    }
    return `
      <div class="quantity-block">
        <div>${escapeHtml(main, "0")}</div>
        ${measurementLine ? `<div class="sub-text"> Tổng cộng ${measurementLine}</div>` : ""}
      </div>
    `;
  };

  const buildTableHeader = () => {
    if (isReturnImport) {
      return `
        <tr>
          <th style="width: 6%">STT</th>
          <th style="width: 24%">Mã sản phẩm tồn kho</th>
          <th style="width: 34%">Tên sản phẩm</th>
          <th style="width: 36%">Thực tế đã nhập</th>
        </tr>
      `;
    }

    return `
      <tr>
        <th style="width: 6%">STT</th>
        <th style="width: 16%">Mã sản phẩm</th>
        <th style="width: 16%">Mã từ nhà cung cấp</th>
        <th style="width: 36%">Tên sản phẩm</th>
        <th style="width: 26%">Nhập thực tế của đơn</th>
      </tr>
    `;
  };

  const buildTableRows = (details: ImportOrderDetailResponse[]) => {
    if (!details.length) {
      const columnCount = isReturnImport ? 4 : 5;
      return `
        <tr>
          <td class="table-center" colspan="${columnCount}">Không có dữ liệu sản phẩm</td>
        </tr>
      `;
    }

    return details
      .map((detail, index) => {
        const itemMeta = findItemMeta(detail);
        const unitType = itemMeta?.unitType ?? "";
        const measurementUnit = itemMeta?.measurementUnit ?? "";
        const actualQuantityCell = formatQuantityBlock(
          detail.actualQuantity,
          unitType,
          detail.actualMeasurementValue,
          measurementUnit,
          true
        );

        if (isReturnImport) {
          return `
            <tr>
              <td class="table-center">${index + 1}</td>
              <td class="table-center">${escapeHtml(
            detail.inventoryItemId ? `${detail.inventoryItemId}` : "-"
          )}</td>
              <td>${escapeHtml(
            detail.itemName || itemMeta?.name || "Không xác định"
          )}</td>
              <td class="table-right">${actualQuantityCell}</td>
            </tr>
          `;
        }

        return `
          <tr>
            <td class="table-center">${index + 1}</td>
            <td class="table-center">${escapeHtml(
          detail.itemId ? `${detail.itemId}` : "-"
        )}</td>
            <td class="table-center">${escapeHtml(detail.providerCode || "-")}</td>
            <td>${escapeHtml(
          detail.itemName || itemMeta?.name || "Không xác định"
        )}</td>
            <td class="table-right">${actualQuantityCell}</td>
          </tr>
        `;
      })
      .join("");
  };

  const generatePDF = () => {
    if (!importOrder) {
      setPdfBlob(null);
      return;
    }

    setLoading(true);

    try {
      const tableHeader = buildTableHeader();
      const tableRows = buildTableRows(importOrderDetails || []);

      const orderIdDisplay = importOrder.importOrderId
        ? `#${importOrder.importOrderId}`
        : "-";
      const importTypeText = getImportTypeText(
        importOrder.importType || importRequest?.importType
      );
      const actualDate = formatDate(importOrder.actualDateReceived);
      const actualTime = formatTime(importOrder.actualTimeReceived);
      const extendedDate = importOrder.isExtended
        ? formatDate(importOrder.extendedDate)
        : null;
      const extendedTime = importOrder.isExtended
        ? formatTime(importOrder.extendedTime)
        : null;
      const providerName = escapeHtml(providerInfo?.name || "-");
      const providerPhone = escapeHtml(providerInfo?.phone || "-");
      const providerAddress = escapeHtml(providerInfo?.address || "-");
      const assignedStaffName = escapeHtml(assignedStaff?.fullName || "-");
      const noteHtml = escapeHtml(importOrder.note || "-").replace(/\n/g, "<br/>");

      const signProviderName = escapeHtml(
        paperData?.signProviderName || providerInfo?.name || "",
        ""
      );
      const signReceiverName = escapeHtml(
        paperData?.signReceiverName || assignedStaff?.fullName || "",
        ""
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
              font-size: 16px;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 20px 15px 0 15px;
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
            .order-id {
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
              font-size: 14px;
            }
            .table th,
            .table td {
              border: 1px solid #000;
              padding: 8px;
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
            .table-right {
              text-align: right;
            }
            .quantity-block div:first-child {
              font-weight: 600;
            }
            .sub-text {
              font-size: 14px;
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
              font-size: 16px;
            }
            .signature-placeholder {
              height: 60px;
              margin: 10px 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 50px;
              padding-top: 5px;
              font-style: italic;
              font-size: 18px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
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

            <div class="document-title">Đơn Nhập Kho</div>
            <div class="order-id">Số: ${escapeHtml(orderIdDisplay)}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Loại đơn nhập:</span>
              <span class="info-value">${importTypeText}</span>
            </div>
            ${importOrder.isExtended
          ? `
            <div class="info-row">
              <span class="info-label">Ngày gia hạn:</span>
              <span class="info-value">${extendedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Giờ gia hạn:</span>
              <span class="info-value">${extendedTime}</span>
            </div>
            ${importOrder.extendedReason ? `
            <div class="info-row">
              <span class="info-label">Lý do gia hạn:</span>
              <span class="info-value break-word">${escapeHtml(importOrder.extendedReason)}</span>
            </div>
            ` : ''}
            `
          : ""
        }
            <div class="info-row">
              <span class="info-label">Ngày nhận thực tế:</span>
              <span class="info-value">${actualDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Giờ nhận thực tế:</span>
              <span class="info-value">${actualTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nhà cung cấp:</span>
              <span class="info-value break-word">${providerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Liên hệ nhà cung cấp:</span>
              <span class="info-value">${providerPhone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Địa chỉ nhà cung cấp:</span>
              <span class="info-value break-word">${providerAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nhân viên phụ trách:</span>
              <span class="info-value">${assignedStaffName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ghi chú:</span>
              <span class="info-value break-word">${noteHtml}</span>
            </div>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="margin-bottom: 15px; font-size: 16px; font-weight: bold;">Danh sách sản phẩm trong đơn nhập</h3>
            <table class="table">
              <thead>${tableHeader}</thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>

          <div class="signature-section" style="padding-left: 40px; padding-right: 40px;">
            <div class="signature-box">
              <div class="signature-title">Đại diện nhà cung cấp</div>
              ${paperData?.signProviderUrl
          ? `
              <div class="signature-placeholder">
                <img src="${paperData.signProviderUrl}" 
                  alt="Chữ ký nhà cung cấp" 
                  style="max-width: 150px; max-height: 80px; object-fit: contain;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; font-weight: bold; font-style: italic;">(Đã ký)</div>
              </div>
              `
          : `
              <div class="signature-placeholder">
                <span style="font-weight: bold; font-style: italic;">(Chưa có chữ ký)</span>
              </div>
              `
        }
              <div class="signature-line">${signProviderName || ""}</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">Nhân viên kho</div>
              ${paperData?.signReceiverUrl
          ? `
              <div class="signature-placeholder">
                <img src="${paperData.signReceiverUrl}" 
                  alt="Chữ ký nhân viên kho" 
                  style="max-width: 150px; max-height: 80px; object-fit: contain;"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div style="display: none; font-weight: bold; font-style: italic;">(Đã ký)</div>
              </div>
              `
          : `
              <div class="signature-placeholder">
                <span style="font-weight: bold; font-style: italic;">(Chưa có chữ ký)</span>
              </div>
              `
        }
              <div class="signature-line">${signReceiverName || ""}</div>
            </div>
          </div>

          <div class="footer">
            <p>Đơn nhập được tạo tự động vào ${dayjs().format(
          "DD/MM/YYYY HH:mm:ss"
        )}</p>
            <p>© Hệ thống quản lý kho - Công ty cổ phần cắt may sofa HOA SEN</p>
          </div>
        </body>
        </html>
      `;

      setPdfBlob(new Blob([htmlContent], { type: "text/html" }));
    } catch (error) {
      console.error("Error generating import order PDF:", error);
      message.error("Không thể tạo file PDF");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaperData = useCallback(async () => {
    if (!importOrder?.importOrderId) {
      setPaperData(null);
      return;
    }

    setPaperLoading(true);
    const response = await getPapersByImportOrderId(
      importOrder.importOrderId,
      1,
      10
    );
    if (response?.content && response.content.length > 0) {
      setPaperData(response.content[0]);
    } else {
      setPaperData(null);
    }
    setPaperLoading(false);
  }, [importOrder?.importOrderId]);

  useEffect(() => {
    if (visible) {
      fetchPaperData();
    } else {
      setPdfBlob(null);
      setPreviewUrl(null);
      setPaperData(null);
      setLoading(false);
    }
  }, [visible, fetchPaperData]);

  useEffect(() => {
    if (!visible || !importOrder || paperLoading) {
      return;
    }
    generatePDF();
  }, [
    visible,
    importOrder,
    importOrderDetails,
    importRequest,
    assignedStaff,
    providerInfo,
    itemsData,
    paperData,
    paperLoading,
  ]);

  useEffect(() => {
    if (!pdfBlob) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(pdfBlob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlob]);

  const handleDownload = () => {
    if (!previewUrl || !importOrder?.importOrderId) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `Phieu_Nhap_${importOrder.importOrderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("Đã tải xuống file PDF");
  };

  const handlePrint = () => {
    if (!previewUrl) return;

    const printWindow = window.open(previewUrl, "_blank");

    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    } else {
      message.error("Không thể mở cửa sổ in");
    }
  };

  const handleClose = () => {
    setPdfBlob(null);
    setPreviewUrl(null);
    setPaperData(null);
    onCancel();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      title={
        <span style={{ fontWeight: 700, fontSize: "18px" }}>
          <FileTextOutlined className="mr-2" />
          Xem trước đơn nhập PDF
        </span>
      }
      width="60%"
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Đóng
        </Button>,
        <Button
          key="download"
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={!previewUrl || loading || paperLoading}
        >
          Tải xuống
        </Button>,
        <Button
          key="print"
          type="primary"
          onClick={handlePrint}
          disabled={!previewUrl || loading || paperLoading}
        >
          In đơn
        </Button>,
      ]}
    >
      <div style={{ height: "75vh", overflow: "hidden" }}>
        {loading || paperLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
            <span className="ml-3">
              {paperLoading
                ? "Đang tải thông tin chữ ký..."
                : "Đang tạo file PDF..."}
            </span>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
            }}
            title="Import Order PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Không thể tạo file PDF
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportOrderPDFPreviewModal;
