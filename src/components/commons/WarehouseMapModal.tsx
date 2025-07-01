import React, { useState } from 'react';
import { Modal, Button, Table, Tag, Card, Space, Checkbox } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';
import { InventoryItemResponse, UpdateInventoryLocationRequest } from '@/services/useInventoryItemService';
import { StoredLocationResponse } from '@/services/useStoredLocationService';
import { ImportOrderResponse } from '@/services/useImportOrderService';

interface WarehouseMapModalProps {
  importOrder: ImportOrderResponse | undefined;
  inventoryItems: InventoryItemResponse[];
  storedLocationData: StoredLocationResponse[];
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onConfirmLocation?: (locationUpdates: UpdateInventoryLocationRequest[]) => Promise<void>;
}

const WarehouseMapModal: React.FC<WarehouseMapModalProps> = ({ open, onClose, importOrder, inventoryItems, storedLocationData, loading, onConfirmLocation }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItemResponse | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Thêm state cho modal xác nhận
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Tổ chức dữ liệu theo cấu trúc Zone -> Floor -> Row -> Line
  const organizeWarehouseData = () => {
    const organized: Record<string, Record<string, Record<string, Record<string, StoredLocationResponse>>>> = {};
    storedLocationData.forEach((location: StoredLocationResponse) => {
      if (!organized[location.zone]) {
        organized[location.zone] = {};
      }
      if (!organized[location.zone][location.floor]) {
        organized[location.zone][location.floor] = {};
      }
      if (!organized[location.zone][location.floor][location.row]) {
        organized[location.zone][location.floor][location.row] = {};
      }
      organized[location.zone][location.floor][location.row][location.line] = location;
    });

    return organized;
  };

  const warehouseData = organizeWarehouseData();
  const zones = Object.keys(warehouseData).sort();
  const floors = ['1', '2', '3', '4', '5'];
  const rows = ['R1', 'R2', 'R3', 'R4'];
  const lines = ['L1', 'L2', 'L3', 'L4'];

  // Hàm xác định màu sắc cho từng ô
  const getCellColor = (location: StoredLocationResponse | undefined) => {
    if (!location) return 'bg-gray-300'; // Chưa có sản phẩm

    // Kiểm tra nếu vị trí này cần được highlight
    const isHighlighted = highlightedItemId && location.itemId === highlightedItemId;

    if (location.isDoor == true) {
      return isHighlighted ?
        'bg-yellow-400 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600' :
        'bg-yellow-400';
    }
    if (location.isRoad == true) {
      return isHighlighted ?
        'bg-blue-200 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600' :
        'bg-blue-200';
    }
    if (location.currentCapacity > 0) {
      return isHighlighted ?
        'bg-green-300 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600' :
        'bg-green-300';
    }

    return isHighlighted ?
      'bg-gray-50 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600' :
      'bg-gray-50';
  };

  // Hàm xác định text cho từng ô
  const getCellText = (location: StoredLocationResponse | undefined) => {
    if (!location) return '';
    if (location.isDoor == true) return 'CỬA';
    if (location.isRoad == true) return 'LỐI ĐI';
    if (location.itemId) {
      if (location.currentCapacity === 0) {
        return (
          <div>
            <div>{location.itemId.split('-')[0]}</div>
            <div>Còn trống</div>
          </div>
        );
      }
      else {
        return (
          <div>
            <div>{location.itemId.split('-')[0]}</div>
            <div>{location.currentCapacity}/{location.maximumCapacityForItem}</div>
          </div>
        );
      }
    }
    return '';
  };

  const renderZoneFloor = (zone: string, floor: string) => {
    return (
      <div key={`${zone}-${floor}`} className="border border-gray-400 p-2">
        <div className="text-center font-bold text-sm mb-2 bg-blue-100 rounded">
          KHU {zone} - TẦNG {floor}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {rows.map(row => (
            lines.map(line => {
              const location = warehouseData[zone]?.[floor]?.[row]?.[line];
              const isHighlighted = highlightedItemId && location?.itemId === highlightedItemId;
              return (
                <div
                  key={`${zone}-${floor}-${row}-${line}`}
                  className={`w-12 h-12 border border-gray-300 flex items-center justify-center text-xs font-medium transition-all duration-300 ${getCellColor(location)}`}
                  style={isHighlighted ? {
                    boxShadow: '0 0 30px rgba(249, 115, 22, 0.8), inset 0 0 20px rgba(249, 115, 22, 0.3)',
                  } : {}}
                >
                  <div className="text-center leading-tight">
                    <div className="text-[8px]">{location ? `${row}-${line}` : ''}</div>
                    <div className="text-[8px]">{getCellText(location)}</div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  // Cấu hình bảng danh sách sản phẩm
  const columns = [
    {
      title: 'Mã sản phẩm',
      dataIndex: 'itemId',
      key: 'itemId',
      width: '15%',
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'itemName',
      key: 'itemName',
      width: '25%',
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: 'Số lượng',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: '10%',
      align: 'right' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '30%',
      align: 'center' as const,
      render: (record: InventoryItemResponse) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleUpdateLocation(record)}
        >
          Cập nhật vị trí
        </Button>
      ),
    },
  ];

  const handleUpdateLocation = (item: InventoryItemResponse) => {
    setSelectedItem(item);
    setHighlightedItemId(item.id);

    // Cuộn xuống phần sơ đồ kho ngay lập tức
    const warehouseMapSection = document.querySelector('[data-warehouse-map]');
    if (warehouseMapSection) {
      warehouseMapSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleConfirmLocation = () => {
    setConfirmModalOpen(true);
    setIsConfirmed(false);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setIsConfirmed(false);
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);

    const locationUpdates: UpdateInventoryLocationRequest[] = inventoryItems
      .filter(item => item.storedLocationId) // Chỉ lấy những item đã có vị trí
      .map(item => ({
        inventoryItemId: item.id,
        storedLocationId: item.storedLocationId!
      }));

    if (locationUpdates.length === 0) {
      console.log('Không có sản phẩm nào cần cập nhật vị trí');
      setIsConfirming(false);
      return;
    }

    await onConfirmLocation(locationUpdates);
    setConfirmModalOpen(false);
    setIsConfirmed(false);
    onClose();

    setIsConfirming(false);
  };

  return (
    <>
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-900">Sơ đồ kho</h3>
            <p className="text-sm text-gray-600 mt-1">Bản đồ vị trí lưu trữ trong kho</p>
            {highlightedItemId && (
              <div className="mt-2 p-2 bg-orange-100 rounded-md border border-orange-300">
                <p className="text-sm font-medium text-orange-800">
                  🔍 Chọn vị trí để cập nhật số lượng sản phẩm: <span className="font-bold">{highlightedItemId}</span>
                </p>
                <button
                  onClick={() => setHighlightedItemId(null)}
                  className="text-xs text-orange-600 hover:text-orange-800 underline mt-1"
                >
                  Đã chọn xong
                </button>
              </div>
            )}
          </div>
        }
        open={open}
        loading={loading}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirmLocation}
            disabled={!onConfirmLocation}
          >
            Xác nhận vị trí lưu kho
          </Button>
        ]}
        width={1200}
        styles={{
          content: { minWidth: "1200px" },
          body: { overflowY: "auto", maxHeight: "70vh" },
        }}
      >
        <div className="space-y-6">
          {/* Danh sách sản phẩm trong kho */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-blue-800">
                  Danh sách sản phẩm trong kho ({inventoryItems.length} sản phẩm)
                </span>
              </div>
            }
            className="mb-6"
          >
            <Table
              columns={columns}
              dataSource={importOrder?.importOrderDetails}
              rowKey="id"
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} sản phẩm`,
              }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Chú giải */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm justify-items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-300 border border-gray-300"></div>
                <span>Có sản phẩm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300"></div>
                <span>Vị trí trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 border border-gray-300"></div>
                <span>Lối đi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 border border-gray-300"></div>
                <span>Cửa</span>
              </div>
            </div>
          </div>

          {/* Sơ đồ kho */}
          <div className="space-y-6" data-warehouse-map>
            {floors.map(floor => (
              <div key={floor} className="border-2 border-blue-300 p-2 rounded-lg bg-blue-50">
                <h3 className="text-lg font-bold text-center text-blue-800">
                  TẦNG {floor}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {zones.map(zone =>
                    warehouseData[zone]?.[floor] ? renderZoneFloor(zone, floor) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-lg font-bold">Xác nhận vị trí lưu kho</h3>
          </div>
        }
        open={confirmModalOpen}
        onCancel={handleCloseConfirmModal}
        footer={[
          <Button key="cancel" onClick={handleCloseConfirmModal} disabled={isConfirming}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!isConfirmed}
            loading={isConfirming}
            onClick={handleFinalConfirm}
          >
            Tôi xác nhận vị trí lưu kho
          </Button>
        ]}
        width={500}
        centered
        maskClosable={!isConfirming}
      >
        <div className="py-4">
          <div className="border-t border-gray-200 pt-4">
            <Checkbox
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="text-sm"
              disabled={isConfirming}
            >
              <span className='font-bold'>
                Tôi đã kiểm tra kỹ và xác nhận các vị trí lưu kho đã được sắp xếp chính xác
              </span>
            </Checkbox>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default WarehouseMapModal; 