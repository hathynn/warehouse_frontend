import React, { useEffect, useState } from "react";
import { Table, Select, Input, Card, TablePaginationConfig, Alert } from "antd";
import { usePaginationViewTracker } from "@/hooks/usePaginationViewTracker";
import { ImportRequestDetailRow } from "@/utils/interfaces";

interface ItemType {
  id: string;
  name: string;
  measurementUnit?: string;
  measurementValue?: number;
  providerIds: number[];
}

interface ProviderType {
  id: number;
  name: string;
}

interface EditableImportRequestOrderTableProps {
  data: ImportRequestDetailRow[];
  setData: (data: ImportRequestDetailRow[]) => void;
  items: ItemType[];
  providers: ProviderType[];
  alertNode?: React.ReactNode;
  emptyText?: React.ReactNode;
  title?: string;
  setIsAllPagesViewed?: (isValid: boolean) => void;
}

const EditableImportRequestOrderTable: React.FC<EditableImportRequestOrderTableProps> = ({
  data,
  setData,
  items,
  providers,
  alertNode,
  emptyText,
  title = "Danh sách hàng hóa từ file Excel",
  setIsAllPagesViewed,
}) => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: data.length,
  });

  const { allPagesViewed, markPageAsViewed } = usePaginationViewTracker(
    data.length,
    pagination.pageSize,
    pagination.current
  );

  useEffect(() => {
    if (allPagesViewed) {
      setIsAllPagesViewed?.(true);
    } else {
      setIsAllPagesViewed?.(false);
    }
  }, [allPagesViewed, setIsAllPagesViewed]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    markPageAsViewed(newPagination.current || 1);
  };

  const handleCellChange = (value: any, record: ImportRequestDetailRow, field: keyof ImportRequestDetailRow) => {
    setData(
      data.map(row => {
        if (row === record) {
          if (field === 'itemId') {
            const selectedItem = items.find(i => i.id === value);
            if (!selectedItem) return row;
            let newProviderId = row.providerId;
            if (!selectedItem.providerIds.includes(row.providerId)) {
              newProviderId = selectedItem.providerIds[0];
            }
            const newProvider = providers.find(p => p.id === newProviderId);
            return {
              ...row,
              itemId: selectedItem.id,
              itemName: selectedItem.name,
              measurementUnit: selectedItem.measurementUnit,
              measurementValue: selectedItem.measurementValue,
              providerId: newProviderId,
              providerName: newProvider ? newProvider.name : '',
            };
          } else if (field === 'providerId') {
            const newProvider = providers.find(p => p.id === value);
            return {
              ...row,
              providerId: value,
              providerName: newProvider ? newProvider.name : '',
            };
          } else if (field === 'quantity') {
            return {
              ...row,
              quantity: value,
            };
          }
        }
        return row;
      })
    );
  };

  // Tổng hợp lỗi validation
  const invalidRows = data
    .map((row, idx) => {
      if (row.quantity <= 0) {
        return `Dòng ${idx + 1}: Số lượng đang bằng 0. Nếu bạn tiếp tục, mã hàng này sẽ bị loại bỏ.`;
      }
      return null;
    })
    .filter(Boolean);

  const validationAlertNode = invalidRows.length > 0 ? (
    <Alert
      type="error"
      showIcon
      message="Có vấn đề trong bảng nhập liệu:"
      description={
        <ul>
          {invalidRows.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      }
      style={{ marginBottom: 16 }}
    />
  ) : null;

  const columns = [
    {
      width: "25%",
      title: <span className="font-semibold">Tên hàng</span>,
      dataIndex: "itemName",
      key: "itemName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      // render: (_: any, record: ImportRequestDetailRow) => {
      //   const usedItemIds = data.filter(r => r !== record).map(r => r.itemId);
      //   const selectableItems = items.filter(item => !usedItemIds.includes(item.id) || item.id === record.itemId);
      //   return (
      //     <Select
      //       value={record.itemId}
      //       onChange={val => handleCellChange(val, record, 'itemId')}
      //       style={{ width: '100%' }}
      //       showSearch
      //       optionFilterProp="children"
      //     >
      //       {selectableItems.map(item => (
      //         <Select.Option key={item.id} value={item.id}>
      //           {item.name}
      //         </Select.Option>
      //       ))}
      //     </Select>
      //   );
      // },
    },
    {
      width: "10%",
      title: <span className="font-semibold">Số lượng</span>,
      dataIndex: "quantity",
      key: "quantity",
      align: "right" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (value: number, record: ImportRequestDetailRow) => (
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '');
            handleCellChange(val ? Number(val) : '', record, 'quantity');
          }}
          style={{ textAlign: 'right', width: '100%' }}
          onWheel={e => e.currentTarget.blur()}
          onKeyDown={e => {
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault();
            }
          }}
        />
      ),
    },
    {
      width: "12%",
      title: <span className="font-semibold">Đơn vị</span>,
      dataIndex: "unitType",
      key: "unitType",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      width: "18%",
      title: <span className="font-semibold">Quy cách</span>,
      dataIndex: "unitType",
      key: "unitType",
      align: "center" as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportRequestDetailRow) => {
        return record.measurementValue + " " + record.measurementUnit + " / " + record.unitType
      }
    },
    {
      width: "35%",
      title: <span className="font-semibold">Nhà cung cấp</span>,
      dataIndex: "providerName",
      key: "providerName",
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (_: any, record: ImportRequestDetailRow) => {
        const selectedItem = items.find(i => i.id === record.itemId);
        const validProviderIds = selectedItem ? selectedItem.providerIds : [];
        const selectableProviders = providers.filter(p => validProviderIds.includes(p.id));
        return (
          <Select
            value={record.providerId}
            onChange={val => handleCellChange(val, record, 'providerId')}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            placeholder="Tìm theo nhà cung cấp..."
          >
            {selectableProviders.map(provider => (
              <Select.Option key={provider.id} value={provider.id}>
                {provider.name}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <Card title={title}>
      {validationAlertNode}
      {alertNode}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record, index) => index as number}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total: number) => `Tổng ${total} mục`,
          pageSizeOptions: ['5', '10', '20', '50'],
          locale: {
            items_per_page: "/ trang"
          },
          hideOnSinglePage: true,
        }}
        onChange={handleTableChange}
        locale={{ emptyText: emptyText || "Không có dữ liệu" }}
      />
    </Card>
  );
};

export default EditableImportRequestOrderTable;
