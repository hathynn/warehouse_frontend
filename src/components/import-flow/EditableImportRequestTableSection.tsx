import React from "react";
import { Table, Select, Input, Card } from "antd";

interface ImportRequestDetailRow {
  itemId: number;
  quantity: number;
  providerId: number;
  itemName: string;
  providerName: string;
  measurementUnit?: string;
  totalMeasurementValue?: number;
}

interface ItemType {
  id: number;
  name: string;
  measurementUnit?: string;
  totalMeasurementValue?: number;
  providerIds: number[];
}

interface ProviderType {
  id: number;
  name: string;
}

interface EditableImportRequestTableSectionProps {
  data: ImportRequestDetailRow[];
  setData: (data: ImportRequestDetailRow[]) => void;
  items: ItemType[];
  providers: ProviderType[];
  loading?: boolean;
  alertNode?: React.ReactNode;
  emptyText?: React.ReactNode;
  title?: string;
}

const EditableImportRequestTableSection: React.FC<EditableImportRequestTableSectionProps> = ({
  data,
  setData,
  items,
  providers,
  loading = false,
  alertNode,
  emptyText,
  title = "Chi tiết hàng hóa từ file Excel"
}) => {
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
              totalMeasurementValue: selectedItem.totalMeasurementValue,
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

  const columns = [
    {
      title: <span className="font-semibold">Tên hàng</span>,
      dataIndex: "itemName",
      key: "itemName",
      width: "25%",
      render: (_: any, record: ImportRequestDetailRow) => {
        const usedItemIds = data.filter(r => r !== record).map(r => r.itemId);
        const selectableItems = items.filter(item => !usedItemIds.includes(item.id) || item.id === record.itemId);
        return (
          <Select
            value={record.itemId}
            onChange={val => handleCellChange(val, record, 'itemId')}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
          >
            {selectableItems.map(item => (
              <Select.Option key={item.id} value={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: <span className="font-semibold">Số lượng</span>,
      dataIndex: "quantity",
      key: "quantity",
      align: "right" as const,
      width: "15%",
      render: (value: number, record: ImportRequestDetailRow) => (
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          min={1}
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
      title: <span className="font-semibold">Giá trị đo lường</span>,
      dataIndex: "totalMeasurementValue",
      key: "totalMeasurementValue",
      align: "right" as const,
      width: "15%",
    },
    {
      title: <span className="font-semibold">Đơn vị tính</span>,
      dataIndex: "measurementUnit",
      key: "measurementUnit",
      width: "10%",
    },
    {
      title: <span className="font-semibold">Nhà cung cấp</span>,
      dataIndex: "providerName",
      key: "providerName",
      width: "35%",
      render: (_: any, record: ImportRequestDetailRow) => {
        const selectedItem = items.find(i => i.id === record.itemId);
        const validProviderIds = selectedItem ? selectedItem.providerIds : [];
        const selectableProviders = providers.filter(p => validProviderIds.includes(p.id));
        return (
          <Select
            value={record.providerId}
            onChange={val => handleCellChange(val, record, 'providerId')}
            style={{ width: '100%' }}
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
      {alertNode}
      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record, index) => index as number}
        loading={loading}
        pagination={false}
        className="custom-table"
        locale={{ emptyText: emptyText || "Không có dữ liệu" }}
      />
    </Card>
  );
};

export default EditableImportRequestTableSection;
