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
  const [selectingLocationId, setSelectingLocationId] = useState<number | null>(null);

  const [inventoryItemsBeforeUpdate, setInventoryItemsBeforeUpdate] = useState<InventoryItemResponse[]>([]);

  const [readyToStoreConfirmModalOpen, setReadyToStoreConfirmModalOpen] = useState(false);
  const [readyToStoreResponsibilityChecked, setReadyToStoreResponsibilityChecked] = useState(false);

  const [inventoryItemsLocationConfirmModalOpen, setInventoryItemsLocationConfirmModalOpen] = useState(false);
  const [inventoryItemsLocationResponsibilityChecked, setInventoryItemsLocationResponsibilityChecked] = useState(false);

  // Hàm lấy những vị trí phù hợp
  const getSuitableLocations = (itemId: string) => {
    if (!itemId) return [];
    const totalItemCount = inventoryItems.filter(inv => inv.itemId === itemId).length
    if (totalItemCount === 0) return [];

    return storedLocationData.filter(location => {
      if (location.itemId != itemId) return false;
      return location.maximumCapacityForItem >= totalItemCount;
    })

  }

  // Hàm tính số lượng inventory items đã có vị trí cho từng itemId
  const getInventoryQuantityByItemId = (itemId: string) => {
    const itemInventories = inventoryItems.filter(inv => inv.itemId === itemId);
    const positioned = itemInventories.filter(inv => inv.storedLocationId).length;
    // const unpositioned = itemInventories.filter(inv => !inv.storedLocationId).length;
    return { positioned, total: itemInventories.length };
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

    // Kiểm tra nếu vị trí này đang được chọn (selecting)
    const isSelecting = selectingLocationId === location.id;

    // Kiểm tra nếu vị trí này cần được highlight
    const isHighlighted = highlightedItemId && location.itemId === highlightedItemId;

    // Kiểm tra vị trí có phù hợp để chọn không
    const isSuitable = highlightedItemId ?
      getSuitableLocations(highlightedItemId).some(loc => loc.id === location.id) :
      false;

    // Luôn luôn sử dụng dữ liệu thực tế từ inventoryItems
    const actualQuantityInLocation = location.itemId ?
      getInventoryQuantityInLocation(location.itemId, location.id) :
      0;

    // Hiệu ứng selecting (ưu tiên cao nhất)
    if (isSelecting) {
      return 'bg-blue-400 ring-4 ring-blue-600 ring-opacity-90 shadow-xl shadow-blue-400 transform scale-105 z-20 relative border-2 border-blue-700';
    }

    if (actualQuantityInLocation > 0) {
      if (isHighlighted && isSuitable) {
        return 'bg-green-300 ring-4 ring-orange-500 ring-opacity-90 shadow-xl shadow-orange-400 transform scale-105 z-10 relative border-2 border-orange-600 cursor-pointer hover:scale-110';
      }
      return 'bg-green-300';
    }

    if (isHighlighted && isSuitable) {
      return 'bg-gray-50 ring-4 ring-orange-500 ring-opacity-90 shadow-xl shadow-orange-400 transform scale-105 z-10 relative border-2 border-orange-600 cursor-pointer hover:scale-110';
    }

    return 'bg-gray-50';
  };

  // Hàm xác định text cho từng ô
  const getCellText = (location: StoredLocationResponse | undefined) => {
    if (!location) return '';
    if (location.itemId) {
      // Luôn luôn sử dụng dữ liệu thực tế từ inventoryItems
      const displayQuantity = getInventoryQuantityInLocation(location.itemId, location.id);
      return (
        <div>
          <div>{location.itemId}</div>
          <div>{displayQuantity}/{location.maximumCapacityForItem}</div>
        </div>
      );
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
      <div key={`${zone}-${floor}`} className="p-2 mx-auto border border-gray-400 max-w-fit">
        <div className="px-2 py-1 mb-2 text-sm font-bold text-center bg-blue-100 rounded">
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
            const isSuitable = highlightedItemId ? getSuitableLocations(highlightedItemId).some(loc => loc.id === location.id) : false;
            return (
              <div
                key={`${zone}-${floor}-${row}-${line}`}
                className={`w-14 h-12 border border-gray-300 flex items-center justify-center text-xs font-medium transition-all duration-300 relative group ${getCellColor(location)} ${isHighlighted && isSuitable ? 'cursor-pointer hover:transform hover:scale-105 hover:brightness-110' : ''
                  }`}
                style={isHighlighted ? {
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.8), inset 0 0 15px rgba(249, 115, 22, 0.3)',
                } : {}}
                onClick={isHighlighted && isSuitable ? () => handleLocationClick(location) : undefined}
                title={isHighlighted && isSuitable ? "Click để chọn vị trí" : undefined}
              >
                <div className="leading-tight text-center">
                  <div className="text-[8px]">{`${row}-${line}`}</div>
                  <div className="text-[8px]">{getCellText(location)}</div>
                </div>

                {/* Tooltip chỉ hiện khi highlighted và hover */}
                {isHighlighted && isSuitable && (
                  <div className="absolute z-20 px-2 py-1 mb-2 text-xs text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-800 rounded opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 whitespace-nowrap">
                    Chọn vị trí để di chuyển
                    <div className="absolute transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-transparent top-full left-1/2 border-t-gray-800"></div>
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
      width: '10%',
      align: 'right' as const,
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
    },
    {
      title: 'Vị trí hiện tại',
      key: 'currentLocation',
      width: '30%',
      align: 'center' as const,
      render: (record: ImportOrderDetailResponse) => {
        // Tìm vị trí hiện tại của sản phẩm này
        const itemInventories = inventoryItems.filter(inv => inv.itemId ===
          record.itemId.toString());

        if (itemInventories.length === 0) {
          return <span className="text-gray-500">Không có dữ liệu</span>;
        }

        // Lấy vị trí của item đầu tiên (vì tất cả cùng itemId sẽ ở cùng vị trí)
        const firstItem = itemInventories[0];
        console.log(firstItem.storedLocationName)
        if (!firstItem.storedLocationId || !firstItem.storedLocationName) {
          return <span className="text-orange-600">Chưa có vị trí</span>;
        }
        return (
            <div className="font-medium">
              {firstItem.storedLocationName}
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
    if (!selectingLocationId || !highlightedItemId) return;

    const selectedLocation = storedLocationData.find(loc => loc.id === selectingLocationId);
    if (!selectedLocation) return;

    // Cập nhật tất cả inventory items của itemId vào vị trí được chọn
    const updatedInventoryItems = inventoryItems.map(inv => {
      if (inv.itemId === highlightedItemId) {
        return {
          ...inv,
          storedLocationId: selectedLocation.id,
          storedLocationName: `${selectedLocation.zone}-${selectedLocation.floor}-${selectedLocation.row}-${selectedLocation.line}`
        };
      }
      return inv;
    });

    onUpdateInventoryItemsLocation(updatedInventoryItems);

    const changedInventoryItems = inventoryItems.filter(
      inv => inv.itemId === highlightedItemId
    ).map(item => ({
      inventoryItemId: item.id,
      storedLocationId: selectedLocation.id
    }));;

    // Chỉ gọi API nếu có thay đổi
    if (changedInventoryItems.length > 0) {
      await onUpdateInventoryItemsLocationConfirm(changedInventoryItems);
    }

    setInventoryItemsLocationConfirmModalOpen(false);
    setInventoryItemsLocationResponsibilityChecked(false);
    setSelectedImportOrderDetail(null);
    setHighlightedItemId(null);
    setSelectingLocationId(null);
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

  const handleCancelUpdate = () => {
    // Khôi phục lại inventoryItems về trạng thái ban đầu
    if (inventoryItemsBeforeUpdate.length > 0) {
      onUpdateInventoryItemsLocation(inventoryItemsBeforeUpdate);
    }

    // Reset các state
    setSelectedImportOrderDetail(null);
    setHighlightedItemId(null);
    setSelectingLocationId(null); // Thêm dòng này
    setInventoryItemsBeforeUpdate([]);
  };

  const handleLocationClick = (location: StoredLocationResponse) => {
    if (!selectedImportOrderDetail || !highlightedItemId) return;

    const suitableLocations = getSuitableLocations(highlightedItemId);
    const isSuitable = suitableLocations.some(loc => loc.id === location.id);
    if (!isSuitable) return;

    if (selectingLocationId === location.id) {
      // Nếu click lại vị trí đã chọn thì bỏ chọn
      setSelectingLocationId(null);
    } else {
      // Chọn vị trí mới
      setSelectingLocationId(location.id);
    }
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


  return (
    <>
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-900">Đợt nhập #{importOrder?.importOrderId}</h3>
            <p className="mt-1 text-sm text-gray-600">Cập nhật số lượng sản phẩm trong các vị trí lưu trữ</p>
            {highlightedItemId && (
              <div className="p-2 mt-2 border border-orange-300 rounded-md bg-orange-50">
                <p className="text-sm font-medium text-blue-800">
                  Chọn vị trí để cập nhật số lượng: <span className="font-bold">#{highlightedItemId}</span>
                </p>
                <Button
                  type="primary"
                  onClick={handleInventoryItemsLocationConfirm}
                  disabled={!selectingLocationId}
                  className="mt-1 text-xs font-medium text-orange-600 hover:text-orange-800"
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
          <div className="p-2 mb-1 bg-gray-200 rounded-lg">
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
                <div key={floor} className="p-3 border-2 border-blue-300 rounded-lg bg-blue-50">
                  <h3 className="mb-3 text-lg font-bold text-center text-blue-800">
                    KHU VỰC {floor}
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
              <div className="py-8 text-center text-gray-500">
                <p className="text-lg">📦 Chưa có sản phẩm nào được lưu kho</p>
                <p className="mt-2 text-sm">Các sản phẩm trong đợt nhập này chưa được phân bổ vị trí lưu trữ</p>
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
          <div className="pt-4 border-t border-gray-200">
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
          <div className="pt-4 border-t border-gray-200">
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
    </>
  );
};

export default UpdateInventoryItemLocationModal; 