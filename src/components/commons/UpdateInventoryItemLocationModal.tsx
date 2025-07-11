import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Tag, Card, Space, Checkbox, InputNumber, Radio } from 'antd';
import { EditOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons';
import { InventoryItemResponse, UpdateInventoryLocationRequest } from '@/services/useInventoryItemService';
import { StoredLocationResponse } from '@/services/useStoredLocationService';
import { ImportOrderResponse } from '@/services/useImportOrderService';
import { ImportOrderDetailResponse } from '@/services/useImportOrderDetailService';
import { MapPinHouseIcon } from 'lucide-react';

interface UpdateInventoryItemLocationModalProps {
  importOrder: ImportOrderResponse | undefined;
  inventoryItems: InventoryItemResponse[];
  storedLocationData: StoredLocationResponse[];
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onReadyToStoreConfirm: () => Promise<void>;
  onUpdateInventoryItemsLocation: (updatedItems: InventoryItemResponse[]) => void;
  onUpdateInventoryItemsLocationConfirm: (changedItems: { inventoryItemId: string; storedLocationId: number }[]) => Promise<void>;
}

const UpdateInventoryItemLocationModal: React.FC<UpdateInventoryItemLocationModalProps> = (
  { open,
    onClose,
    importOrder,
    inventoryItems,
    storedLocationData,
    loading,
    onReadyToStoreConfirm,
    onUpdateInventoryItemsLocation,
    onUpdateInventoryItemsLocationConfirm }
) => {

  const [selectedImportOrderDetail, setSelectedImportOrderDetail] = useState<ImportOrderDetailResponse | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Thêm state để lưu trữ trạng thái ban đầu của inventoryItems
  const [inventoryItemsBeforeUpdate, setInventoryItemsBeforeUpdate] = useState<InventoryItemResponse[]>([]);

  // Thêm state cho modal xác nhận
  const [readyToStoreConfirmModalOpen, setReadyToStoreConfirmModalOpen] = useState(false);
  const [readyToStoreResponsibilityChecked, setReadyToStoreResponsibilityChecked] = useState(false);

  // Thêm state cho modal xác nhận đã chọn xong
  const [inventoryItemsLocationConfirmModalOpen, setInventoryItemsLocationConfirmModalOpen] = useState(false);
  const [inventoryItemsLocationResponsibilityChecked, setInventoryItemsLocationResponsibilityChecked] = useState(false);

  // Thêm state cho modal cập nhật số lượng
  const [transferLocationModalOpen, setTransferLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StoredLocationResponse | null>(null);
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  const [operationType, setOperationType] = useState<'add' | 'remove'>('add');

  // Hàm tính số lượng inventory items đã có vị trí và chưa có vị trí cho từng itemId
  const getInventoryQuantityByItemId = (itemId: string) => {
    const itemInventories = inventoryItems.filter(inv => inv.itemId === itemId);
    const positioned = itemInventories.filter(inv => inv.storedLocationId).length;
    const unpositioned = itemInventories.filter(inv => !inv.storedLocationId).length;
    return { positioned, unpositioned, total: itemInventories.length };
  };

  // Hàm tính số lượng inventory items trong một vị trí cụ thể cho một itemId
  const getInventoryQuantityInLocation = (itemId: string, locationId: number) => {
    return inventoryItems.filter(inv =>
      inv.itemId === itemId && inv.storedLocationId === locationId
    ).length;
  };

  // Lọc chỉ những vị trí có sản phẩm thuộc đợt nhập hiện tại
  const getFilteredStoredLocationData = () => {
    if (!importOrder?.importOrderDetails) return [];

    const importItemIds = importOrder.importOrderDetails.map(detail => detail.itemId.toString());

    return storedLocationData.filter(location => {
      // Chỉ hiển thị location nếu có itemId thuộc đợt nhập hiện tại
      // Không hiện cửa và lối đi
      return location.itemId && importItemIds.includes(location.itemId);
    });
  };

  const filteredStoredLocationData = getFilteredStoredLocationData();

  // Tổ chức dữ liệu theo cấu trúc Zone -> Floor -> Row -> Line (chỉ với dữ liệu đã lọc)
  const organizeWarehouseData = () => {
    const organized: Record<string, Record<string, Record<string, Record<string, StoredLocationResponse>>>> = {};
    filteredStoredLocationData.forEach((location: StoredLocationResponse) => {
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
    if (!location) return 'bg-gray-300';

    // Kiểm tra nếu vị trí này cần được highlight
    const isHighlighted = highlightedItemId && location.itemId === highlightedItemId;

    // Luôn luôn sử dụng dữ liệu thực tế từ inventoryItems thay vì location.currentCapacity
    const actualQuantityInLocation = location.itemId ?
      getInventoryQuantityInLocation(location.itemId, location.id) :
      0;

    if (actualQuantityInLocation > 0) {
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
    if (location.itemId) {
      // Luôn luôn sử dụng dữ liệu thực tế từ inventoryItems
      const displayQuantity = getInventoryQuantityInLocation(location.itemId, location.id);

      if (displayQuantity === 0) {
        return (
          <div>
            <div>{location.itemId}</div>
            <div>Còn trống</div>
          </div>
        );
      }
      else {
        return (
          <div>
            <div>{location.itemId}</div>
            <div>{displayQuantity}/{location.maximumCapacityForItem}</div>
          </div>
        );
      }
    }
    return '';
  };

  // Helper functions để tính toán grid columns (sửa lại logic)
  const getZoneGridCols = (zonesCount: number) => {
    if (zonesCount === 1) return 'grid-cols-1';
    if (zonesCount === 2) return 'grid-cols-2';
    if (zonesCount === 3) return 'grid-cols-3';
    if (zonesCount === 4) return 'grid-cols-4';
    if (zonesCount === 5) return 'grid-cols-5';
    if (zonesCount === 6) return 'grid-cols-6';
    return 'grid-cols-7'; // max 7 cột
  };

  const getLocationGridCols = (locationsCount: number) => {
    // Logic đơn giản: số cột = số locations (tối đa 6)
    return Math.min(locationsCount, 2);
  };

  const renderZoneFloor = (zone: string, floor: string) => {
    // Lấy dữ liệu thực tế cho zone-floor này (chỉ sản phẩm thuộc đợt nhập)
    const zoneFloorData = warehouseData[zone]?.[floor];
    if (!zoneFloorData) return null;

    // Lấy danh sách location có sản phẩm thuộc đợt nhập hiện tại
    const relevantLocations: { row: string; line: string; location: StoredLocationResponse }[] = [];

    Object.keys(zoneFloorData).forEach(row => {
      Object.keys(zoneFloorData[row]).forEach(line => {
        const location = zoneFloorData[row][line];
        if (location && location.itemId) {
          relevantLocations.push({ row, line, location });
        }
      });
    });

    if (relevantLocations.length === 0) return null;

    // Tính toán số cột cho grid layout - đơn giản là số locations (tối đa 6)
    const gridCols = getLocationGridCols(relevantLocations.length);

    return (
      <div key={`${zone}-${floor}`} className="border border-gray-400 p-2 max-w-fit mx-auto">
        <div className="text-center font-bold text-sm mb-2 bg-blue-100 rounded px-2 py-1">
          KHU {zone}
        </div>
        <div
          className="grid gap-1 justify-items-center"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(40px, max-content))`,
            width: 'fit-content'
          }}
        >
          {relevantLocations.map(({ row, line, location }) => {
            const isHighlighted = highlightedItemId && location?.itemId === highlightedItemId;

            return (
              <div
                key={`${zone}-${floor}-${row}-${line}`}
                className={`w-14 h-12 border border-gray-300 flex items-center justify-center text-xs font-medium transition-all duration-300 relative group ${getCellColor(location)} ${isHighlighted ? 'cursor-pointer hover:transform hover:scale-105 hover:brightness-110' : ''
                  }`}
                style={isHighlighted ? {
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.8), inset 0 0 15px rgba(249, 115, 22, 0.3)',
                } : {}}
                onClick={isHighlighted ? () => handleLocationClick(location) : undefined}
                title={isHighlighted ? "Click để cập nhật số lượng" : undefined}
              >
                <div className="text-center leading-tight">
                  <div className="text-[8px]">{`${row}-${line}`}</div>
                  <div className="text-[8px]">{getCellText(location)}</div>
                </div>

                {/* Tooltip chỉ hiện khi highlighted và hover */}
                {isHighlighted && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none">
                    Cập nhật số lượng
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
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
      title: 'Tổng số lượng',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: '15%',
      align: 'right' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: 'Đã có vị trí',
      key: 'locationStatus',
      width: '10%',
      align: 'center' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (record: ImportOrderDetailResponse) => {
        const quantities = getInventoryQuantityByItemId(record.itemId.toString());
        return (
          <div className="text-right">
            <span className="text-green-600 font-semibold">{quantities.positioned}</span>
          </div>
        );
      },
    },
    {
      title: 'Chưa có vị trí',
      key: 'unpositionedQuantity',
      width: '10%',
      align: 'center' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (record: ImportOrderDetailResponse) => {
        const quantities = getInventoryQuantityByItemId(record.itemId.toString());
        return (
          <div className="text-right">
            <span className="text-orange-600 font-semibold">{quantities.unpositioned}</span>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '20%',
      align: 'center' as const,
      render: (record: ImportOrderDetailResponse) => {
        // Nếu không có sản phẩm nào được chọn, hiện tất cả nút "Cập nhật vị trí"
        if (!selectedImportOrderDetail) {
          return (
            <Button
              type="primary"
              size="small"
              icon={<MapPinHouseIcon />}
              onClick={() => handleUpdateLocation(record)}
            >
              Cập nhật vị trí
            </Button>
          );
        }

        // Nếu sản phẩm hiện tại đang được chọn, hiện nút "Huỷ"
        if (selectedImportOrderDetail.itemId === record.itemId) {
          return (
            <Button
              type="default"
              size="small"
              danger
              onClick={handleCancelUpdate}
            >
              Huỷ
            </Button>
          );
        }

        // Nếu có sản phẩm khác đang được chọn, ẩn nút
        return null;
      },
    },
  ];

  const handleOnReadyToStoreConfirm = async () => {
    onClose();
    await onReadyToStoreConfirm();
    setReadyToStoreConfirmModalOpen(false);
  }
  
  const handleOnUpdateInventoryItemsLocationConfirm = async () => {
    // Tạo danh sách các inventory item đã thay đổi vị trí
    const changedInventoryItems = getChangedInventoryItems();
    // Chỉ gọi API nếu có thay đổi
    if (changedInventoryItems.length > 0) {
      await onUpdateInventoryItemsLocationConfirm(changedInventoryItems);
    }
    
    setInventoryItemsLocationConfirmModalOpen(false);
    setInventoryItemsLocationResponsibilityChecked(false);
    setSelectedImportOrderDetail(null);
    setHighlightedItemId(null);
    setInventoryItemsBeforeUpdate([]);
  };

  const handleOnClose = () => {
    handleCancelUpdate();
    onClose();
  };

  const handleUpdateLocation = (importOrderDetail: ImportOrderDetailResponse) => {
    // Lưu trạng thái ban đầu của inventoryItems khi bắt đầu cập nhật
    setInventoryItemsBeforeUpdate([...inventoryItems]);

    setSelectedImportOrderDetail(importOrderDetail);
    setHighlightedItemId(importOrderDetail.itemId.toString());

    // Cuộn xuống phần sơ đồ kho ngay lập tức
    const warehouseMapSection = document.querySelector('[data-warehouse-map]');
    if (warehouseMapSection) {
      warehouseMapSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Sửa hàm huỷ cập nhật vị trí để khôi phục trạng thái ban đầu
  const handleCancelUpdate = () => {
    // Khôi phục lại inventoryItems về trạng thái ban đầu
    if (inventoryItemsBeforeUpdate.length > 0) {
      onUpdateInventoryItemsLocation(inventoryItemsBeforeUpdate);
    }

    // Reset các state
    setSelectedImportOrderDetail(null);
    setHighlightedItemId(null);
    setInventoryItemsBeforeUpdate([]);
  };

  const handleLocationClick = (location: StoredLocationResponse) => {
    if (!selectedImportOrderDetail || !highlightedItemId) return;

    setSelectedLocation(location);
    setTransferQuantity(1);
    setOperationType('add'); // Default to add
    setTransferLocationModalOpen(true);
  };

  const handleReadyToStoreConfirm = () => {
    setReadyToStoreConfirmModalOpen(true);
    setReadyToStoreResponsibilityChecked(false);
  };

  const handleCloseReadyToStoreConfirmModal = () => {
    setReadyToStoreConfirmModalOpen(false);
    setReadyToStoreResponsibilityChecked(false);
  };

  const handleInventoryItemsLocationConfirm = () => {
    setInventoryItemsLocationConfirmModalOpen(true);
    setInventoryItemsLocationResponsibilityChecked(false);
  };

  const handleCloseInventoryItemsLocationConfirmModal = () => {
    setInventoryItemsLocationConfirmModalOpen(false);
    setInventoryItemsLocationResponsibilityChecked(false);
  };

  const handleTransferLocationModalClose = () => {
    setTransferLocationModalOpen(false);
    setSelectedLocation(null);
    setTransferQuantity(1);
    setOperationType('add');
  };

  const handleTransferLocationConfirm = () => {
    if (!selectedLocation || !highlightedItemId || transferQuantity <= 0) return;

    if (operationType === 'add') {
      // Lấy những inventory items chưa có vị trí để thêm vào
      const availableItems = inventoryItems.filter(inventoryItem =>
        inventoryItem.itemId == highlightedItemId && !inventoryItem.storedLocationId
      );
      const itemsToTransfer = availableItems.slice(0, Math.min(transferQuantity, availableItems.length));

      // Cập nhật inventoryItems - thêm vào vị trí
      const updatedInventoryItems = inventoryItems.map(inventoryItem => {
        if (itemsToTransfer.some(transferItem => transferItem.id === inventoryItem.id)) {
          return {
            ...inventoryItem,
            storedLocationId: selectedLocation.id,
            storedLocationName: `${selectedLocation.zone}-${selectedLocation.floor}-${selectedLocation.row}-${selectedLocation.line}`
          };
        }
        return inventoryItem;
      });

      onUpdateInventoryItemsLocation?.(updatedInventoryItems);

    } else {
      // Lấy những inventory items đã có vị trí này để bỏ ra
      const itemsInLocation = inventoryItems.filter(inventoryItem =>
        inventoryItem.itemId == highlightedItemId && inventoryItem.storedLocationId === selectedLocation.id
      );
      const itemsToRemove = itemsInLocation.slice(0, Math.min(transferQuantity, itemsInLocation.length));

      // Cập nhật inventoryItems - lấy ra khỏi vị trí
      const updatedInventoryItems = inventoryItems.map(inventoryItem => {
        if (itemsToRemove.some(removeItem => removeItem.id === inventoryItem.id)) {
          return {
            ...inventoryItem,
            storedLocationId: undefined,
            storedLocationName: undefined
          };
        }
        return inventoryItem;
      });

      onUpdateInventoryItemsLocation?.(updatedInventoryItems);
    }
    // Đóng modal và reset state
    handleTransferLocationModalClose();
  };

  // Tính số lượng có thể thêm vào hoặc lấy ra
  const getAvailableQuantityForOperation = () => {
    if (!highlightedItemId || !selectedLocation) return 0;

    if (operationType === 'add') {
      // Số lượng có thể thêm = số inventory items chưa có vị trí
      const unpositionedCount = inventoryItems.filter(item =>
        item.itemId === highlightedItemId && !item.storedLocationId
      ).length;

      // Cần kiểm tra sức chứa còn lại của vị trí
      const currentInLocation = getInventoryQuantityInLocation(highlightedItemId, selectedLocation.id);
      const remainingCapacity = selectedLocation.maximumCapacityForItem - currentInLocation;

      return Math.min(unpositionedCount, remainingCapacity);
    } else {
      // Số lượng có thể lấy ra = số inventory items đang ở vị trí này
      return getInventoryQuantityInLocation(highlightedItemId, selectedLocation.id);
    }
  };

  // Hàm lấy danh sách các inventory item đã thay đổi vị trí
  const getChangedInventoryItems = () => {
    if (inventoryItemsBeforeUpdate.length === 0) return [];

    // Tạo map để tra cứu nhanh trạng thái ban đầu
    const beforeUpdateMap = new Map(
      inventoryItemsBeforeUpdate.map(item => [item.id, item.storedLocationId])
    );

    // Tìm các inventory item có thay đổi vị trí
    const changedItems = inventoryItems.filter(currentItem => {
      const originalLocationId = beforeUpdateMap.get(currentItem.id);
      const currentLocationId = currentItem.storedLocationId;
      
      // Kiểm tra xem có thay đổi vị trí không
      // Trường hợp 1: Từ không có vị trí -> có vị trí
      // Trường hợp 2: Từ có vị trí -> không có vị trí  
      // Trường hợp 3: Thay đổi từ vị trí này sang vị trí khác
      return originalLocationId !== currentLocationId;
    });

    // Chuyển đổi sang format mà backend API cần
    return changedItems
      .filter(item => item.storedLocationId) // Chỉ lấy các item có vị trí mới
      .map(item => ({
        inventoryItemId: item.id,
        storedLocationId: item.storedLocationId
      }));
  };

  // Hàm kiểm tra xem sản phẩm đang được highlight có còn inventory items chưa có vị trí không
  const hasUnpositionedItemsForHighlighted = () => {
    const quantities = getInventoryQuantityByItemId(highlightedItemId);
    return quantities.unpositioned > 0;
  };

  return (
    <>
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-900">Đợt nhập #{importOrder?.importOrderId}</h3>
            <p className="text-sm text-gray-600 mt-1">Cập nhật số lượng sản phẩm trong các vị trí lưu trữ</p>
            {highlightedItemId && (
              <div className="mt-2 p-2 bg-orange-50 rounded-md border border-orange-300">
                <p className="text-sm font-medium text-blue-800">
                  Chọn vị trí để cập nhật số lượng: <span className="font-bold">#{highlightedItemId}</span>
                </p>
                {hasUnpositionedItemsForHighlighted() && (
                  <p className="text-sm mt-1 font-medium text-orange-800">
                    <WarningOutlined /> <span className="font-bold">CÒN SẢN PHẨM CHƯA CÓ VỊ TRÍ LƯU KHO</span>
                  </p>
                )}
                <Button
                  type="primary"
                  onClick={handleInventoryItemsLocationConfirm}
                  disabled={hasUnpositionedItemsForHighlighted() || getChangedInventoryItems().length === 0}
                  className="text-xs text-orange-600 hover:text-orange-800 mt-1 font-medium"
                >
                  Xác nhận vị trí #{highlightedItemId}
                </Button>
              </div>
            )}
          </div>
        }
        open={open}
        loading={loading}
        onCancel={handleOnClose}
        footer={[
          <Button key="close" onClick={handleOnClose}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleReadyToStoreConfirm}
            disabled={highlightedItemId !== null}
          >
            Xác nhận vị trí lưu kho
          </Button>
        ]}
        width={1180}
        styles={{
          content: { minWidth: "1080px" },
          body: { overflowY: "auto", maxHeight: "70vh" },
        }}
      >
        <div className="space-y-6">
          {/* Danh sách sản phẩm trong kho */}
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

          {/* Chú giải */}
          <div className="bg-gray-200 p-2 rounded-lg mb-1">
            <div className="grid grid-cols-2 gap-4 text-sm justify-items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-300 border border-gray-300"></div>
                <span>Vị trí đã có sản phẩm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white border border-gray-300"></div>
                <span>Vị trí đang trống</span>
              </div>
            </div>
          </div>

          {/* Sơ đồ kho */}
          <div className="space-y-4" data-warehouse-map>
            {floors.map(floor => {
              // Kiểm tra xem floor này có sản phẩm thuộc đợt nhập không
              const hasDataForFloor = zones.some(zone => {
                const zoneFloorData = warehouseData[zone]?.[floor];
                if (!zoneFloorData) return false;

                return Object.values(zoneFloorData).some(rowData =>
                  Object.values(rowData).some(location =>
                    location && location.itemId
                  )
                );
              });

              if (!hasDataForFloor) return null;

              // Tính số zones thực tế có sản phẩm thuộc đợt nhập cho floor này
              const activeZonesForFloor = zones.filter(zone => {
                const zoneFloorData = warehouseData[zone]?.[floor];
                if (!zoneFloorData) return false;

                return Object.values(zoneFloorData).some(rowData =>
                  Object.values(rowData).some(location =>
                    location && location.itemId
                  )
                );
              });

              return (
                <div key={floor} className="border-2 border-blue-300 p-3 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-bold text-center text-blue-800 mb-3">
                    TẦNG {floor}
                  </h3>
                  <div className={`grid gap-3 justify-items-center items-start ${getZoneGridCols(activeZonesForFloor.length)}`}>
                    {zones.map(zone => {
                      // Kiểm tra zone-floor này có sản phẩm thuộc đợt nhập không
                      const zoneFloorData = warehouseData[zone]?.[floor];
                      if (!zoneFloorData) return null;

                      const hasRelevantLocations = Object.values(zoneFloorData).some(rowData =>
                        Object.values(rowData).some(location =>
                          location && location.itemId
                        )
                      );

                      if (!hasRelevantLocations) return null;

                      return renderZoneFloor(zone, floor);
                    })}
                  </div>
                </div>
              );
            })}

            {/* Hiển thị thông báo nếu không có vị trí nào */}
            {filteredStoredLocationData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">📦 Chưa có sản phẩm nào được lưu kho</p>
                <p className="text-sm mt-2">Các sản phẩm trong đợt nhập này chưa được phân bổ vị trí lưu trữ</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận vị trí lưu kho */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-lg font-bold">Tiến hành xác nhận vị trí lưu kho</h3>
          </div>
        }
        open={readyToStoreConfirmModalOpen}
        onCancel={handleCloseReadyToStoreConfirmModal}
        footer={[
          <Button key="cancel" onClick={handleCloseReadyToStoreConfirmModal} disabled={loading}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!readyToStoreResponsibilityChecked}
            loading={loading}
            onClick={handleOnReadyToStoreConfirm}
          >
            Tôi xác nhận vị trí lưu kho
          </Button>
        ]}
        width={500}
        centered
        maskClosable={!loading}
      >
        <div className="py-4">
          <div className="border-t border-gray-200 pt-4">
            <Checkbox
              checked={readyToStoreResponsibilityChecked}
              onChange={(e) => setReadyToStoreResponsibilityChecked(e.target.checked)}
              className="text-sm"
              disabled={loading}
            >
              <span className='font-bold'>
                Tôi đã kiểm tra kỹ và xác nhận các vị trí lưu kho là đúng.
              </span>
            </Checkbox>
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận cập nhật vị trí sản phẩm */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-lg font-bold">Thực hiện cập nhật vị trí cho #{highlightedItemId}</h3>
          </div>
        }
        open={inventoryItemsLocationConfirmModalOpen}
        onCancel={handleCloseInventoryItemsLocationConfirmModal}
        footer={[
          <Button key="cancel" onClick={handleCloseInventoryItemsLocationConfirmModal} disabled={loading}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!inventoryItemsLocationResponsibilityChecked}
            loading={loading}
            onClick={handleOnUpdateInventoryItemsLocationConfirm}
          >
            Tôi xác nhận cập nhật vị trí cho #{highlightedItemId}
          </Button>
        ]}
        width={540}
        centered
        maskClosable={!loading}
      >
        <div className="py-4">
          <div className="border-t border-gray-200 pt-4">
            <Checkbox
              checked={inventoryItemsLocationResponsibilityChecked}
              onChange={(e) => setInventoryItemsLocationResponsibilityChecked(e.target.checked)}
              className="text-sm"
              disabled={loading}
            >
              <span className='font-bold'>
                Tôi đã kiểm tra kĩ và xác nhận cập nhật vị trí cho #{highlightedItemId}.
              </span>
            </Checkbox>
          </div>
        </div>
      </Modal>

      {/* Modal cập nhật số lượng */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-lg font-bold">Cập nhật số lượng tại vị trí</h3>
          </div>
        }
        open={transferLocationModalOpen}
        onCancel={handleTransferLocationModalClose}
        footer={[
          <Button key="cancel" onClick={handleTransferLocationModalClose}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleTransferLocationConfirm}
            disabled={!selectedLocation || transferQuantity <= 0 || transferQuantity > getAvailableQuantityForOperation()}
          >
            Xác nhận {operationType === 'add' ? 'thêm vào' : 'lấy ra'}
          </Button>
        ]}
        width={360}
        centered
      >
        <div className="py-4 space-y-4">
          {selectedLocation && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Vị trí:</h4>
              <p className="text-sm">
                <span className="font-medium">Khu:</span> {selectedLocation.zone} |
                <span className="font-medium"> Tầng:</span> {selectedLocation.floor} |
                <span className="font-medium"> Dãy:</span> {selectedLocation.row} |
                <span className="font-medium"> Cột:</span> {selectedLocation.line}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Hiện có/Tổng sức chứa:</span> {highlightedItemId ? getInventoryQuantityInLocation(highlightedItemId, selectedLocation.id) : selectedLocation.currentCapacity}/{selectedLocation.maximumCapacityForItem}
              </p>
            </div>
          )}

          {highlightedItemId && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Sản phẩm:</h4>
              <p className="text-sm">
                <span className="font-medium">Mã sản phẩm:</span> #{highlightedItemId}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center">
            <Radio.Group
              value={operationType}
              onChange={(e) => {
                setOperationType(e.target.value);
                setTransferQuantity(1); // Reset quantity when changing operation
              }}
              className="w-1/2"
            >
              <Radio value="add" className="w-full mb-2">
                <span className="text-green-600 font-medium">Thêm vào vị trí</span>
              </Radio>
              <Radio value="remove" className="w-full">
                <span className="text-red-600 font-medium">Lấy ra khỏi vị trí</span>
              </Radio>
            </Radio.Group>
            <div>
              <InputNumber
                min={0}
                max={getAvailableQuantityForOperation()}
                value={transferQuantity}
                onChange={(value) => setTransferQuantity(value || 0)}
                className="w-full"
                disabled={!selectedLocation || getAvailableQuantityForOperation() === 0}
              />
            </div>
          </div>

          <div>

            <p className="text-xs text-gray-500 mt-1">
              {selectedLocation ?
                `Tối đa ${getAvailableQuantityForOperation()} sản phẩm có thể ${operationType === 'add' ? 'thêm vào' : 'lấy ra'}` :
                'Chọn vị trí để tiếp tục'
              }
            </p>
            {getAvailableQuantityForOperation() === 0 && selectedLocation && (
              <p className="text-xs text-red-500 mt-1">
                {operationType === 'add' ?
                  'Không có sản phẩm chưa phân vị trí hoặc vị trí đã đầy' :
                  'Không có sản phẩm nào tại vị trí này'
                }
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UpdateInventoryItemLocationModal; 