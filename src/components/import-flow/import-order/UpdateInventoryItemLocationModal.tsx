import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Checkbox, Spin } from 'antd';
import { InventoryItemResponse } from '@/services/useInventoryItemService';
import useStoredLocationService, { StoredLocationResponse } from '@/services/useStoredLocationService';
import { ImportOrderDetailResponse } from '@/services/useImportOrderDetailService';
import { convertStoredLocationName } from '@/utils/helpers';

interface UpdateInventoryItemLocationModalProps {
  inventoryItems: InventoryItemResponse[];
  selectedItem: ImportOrderDetailResponse | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onUpdateInventoryItemsLocationConfirm: (changedItems: { inventoryItemId: string; storedLocationId: number }[]) => Promise<void>;
}

const UpdateInventoryItemLocationModal: React.FC<UpdateInventoryItemLocationModalProps> = (
  { open,
    inventoryItems,
    selectedItem,
    loading,
    onClose,
    onUpdateInventoryItemsLocationConfirm }
) => {

  const { loading: loadingSuggestion, suggestLocations } = useStoredLocationService();

  const [selectingLocationId, setSelectingLocationId] = useState<number | null>(null);
  const [suggestedLocations, setSuggestedLocations] = useState<StoredLocationResponse[]>([]);
  const [currentLocation, setCurrentLocation] = useState<StoredLocationResponse | null>(null);

  const [inventoryItemsLocationConfirmModalOpen, setInventoryItemsLocationConfirmModalOpen] = useState(false);
  const [inventoryItemsLocationResponsibilityChecked, setInventoryItemsLocationResponsibilityChecked] = useState(false);

  useEffect(() => {
    if (selectedItem && open) {
      // Tìm vị trí hiện tại của item để lấy locationId
      const currentInventoryItem = inventoryItems.find(inv => inv.itemId === selectedItem?.itemId.toString());
      if (currentInventoryItem?.storedLocationId) {
        // Parse current location from storedLocationName
        parseCurrentLocation(currentInventoryItem.storedLocationName);
        // Fetch suggested locations
        fetchSuggestedLocations(selectedItem?.itemId.toString(), currentInventoryItem.storedLocationId);
      }
    }
  }, [selectedItem, open, inventoryItems]);

  const parseCurrentLocation = (storedLocationName: string) => {
    // Parse từ format "Zone: A, Floor: 1, Row: R1, Line: L2"
    const parts = storedLocationName.split(', ');
    if (parts.length === 4) {
      const zone = parts[0].replace('Zone: ', '');
      const floor = parts[1].replace('Floor: ', '');
      const row = parts[2].replace('Row: ', '');
      const line = parts[3].replace('Line: ', '');

      // Không cần capacity vì chỉ hiển thị "Hiện tại"

      // Tạo mock StoredLocationResponse cho vị trí hiện tại
      const mockCurrentLocation: StoredLocationResponse = {
        id: -1, // ID âm để phân biệt với suggested locations
        zone,
        floor,
        row,
        line,
        isRoad: false,
        isDoor: false,
        isUsed: true,
        isFulled: false,
        inventoryItemIds: [],
        currentCapacity: 0,
        maximumCapacityForItem: 0,
        itemId: selectedItem?.itemId.toString() || ''
      };

      setCurrentLocation(mockCurrentLocation);
    }
  };

  const fetchSuggestedLocations = async (itemId: string, locationId: number) => {
      const response = await suggestLocations(itemId, locationId);
      setSuggestedLocations(response?.content || []);
  };

  // Hàm tái sử dụng để tìm StoredLocationResponse từ location id
  const findLocationById = (locationId: number): StoredLocationResponse | undefined => {
    return suggestedLocations.find(location => location.id === locationId);
  };

  // Hàm tái sử dụng để lấy tên đầy đủ của vị trí
  const getFullLocationName = (location: StoredLocationResponse): string => {
    return `Khu vực ${location.floor}, Khu ${location.zone}, Dãy ${location.row}, Hàng ${location.line}`;
  };

  // Lọc chỉ những vị trí được suggest và không phải road/door/used/fulled, bao gồm cả vị trí hiện tại
  const getFilteredStoredLocationData = () => {
    if (!selectedItem) return [];
    const filtered = suggestedLocations.filter(location =>
      !location.isRoad &&
      !location.isDoor &&
      !location.isFulled
    );

    // Thêm vị trí hiện tại vào danh sách để hiển thị
    if (currentLocation) {
      filtered.push(currentLocation);
    }

    return filtered;
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
  // Hàm tạo props cho cell
  const getCellProps = (location: StoredLocationResponse | undefined) => {
    if (!location) return { color: '', onClick: () => {}, title: '', clickable: true, isCurrentLocation: false };

    const isSelecting = selectingLocationId === location.id;
    const isEmpty = location.currentCapacity === 0;
    const isCurrentLocation = location.id === -1; // Vị trí hiện tại có id = -1

    let color = 'bg-green-100 border-green-400';
    let clickable = true;
    let title = "Click để chọn vị trí gợi ý";

    if (isCurrentLocation) {
      color = 'bg-red-100 border-red-300';
      clickable = false;
      title = "Vị trí hiện tại - không thể chọn";
    } else if (isSelecting) {
      color = 'bg-blue-300 ring-4 ring-blue-600 ring-opacity-90 transform scale-105 z-20 relative border-2';
    } else if (isEmpty) {
      color = 'bg-gray-100';
    }

    return {
      color,
      onClick: clickable ? () => handleLocationClick(location) : () => {},
      title,
      clickable,
      isCurrentLocation
    };
  };

  // Hàm xác định text cho từng ô
  const getCellText = (location: StoredLocationResponse | undefined) => {
    if (!location) return '';

    const isCurrentLocation = location.id === -1;
    const isSuggested = suggestedLocations.some(suggested => suggested.id === location.id);
    const isEmpty = location.currentCapacity === 0;

    if (isCurrentLocation) {
      return (
        <div className="font-bold text-red-500">Hiện tại</div>
      );
    }

    if (isSuggested) {
      if (isEmpty) {
        return (
          <div>Trống</div>
        );
      }
      return (
        <div>{location.currentCapacity}/{location.maximumCapacityForItem}</div>
      );
    }

    return '';
  };

  // Helper functions để tính toán grid columns
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
    // Lấy dữ liệu thực tế cho zone-floor này
    const zoneFloorData = warehouseData[zone]?.[floor];
    if (!zoneFloorData) return null;

    // Lấy danh sách location là suggested locations
    const relevantLocations: { row: string; line: string; location: StoredLocationResponse }[] = [];

    Object.keys(zoneFloorData).forEach(row => {
      Object.keys(zoneFloorData[row]).forEach(line => {
        const location = zoneFloorData[row][line];
        // Hiển thị cả suggested locations và current location (id = -1)
        if (location && (suggestedLocations.some(suggested => suggested.id === location.id) || location.id === -1)) {
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
            const cellProps = getCellProps(location);

            return (
              <div
                key={`${zone}-${floor}-${row}-${line}`}
                className={`w-14 h-12 border border-gray-300 flex items-center justify-center font-medium transition-all duration-300 relative group ${cellProps.color} ${cellProps.clickable ? 'cursor-pointer hover:transform hover:scale-110 hover:brightness-110' : 'cursor-not-allowed'}`}
                onClick={cellProps.onClick}
                title={cellProps.title}
              >
                <div className="leading-tight text-center">
                  <div className="text-[10px]">{`${row}-${line}`}</div>
                  <div className="text-[10px]">{getCellText(location)}</div>
                </div>

                {/* Tooltip hover - chỉ hiển thị cho vị trí có thể click */}
                {cellProps.clickable && (
                  <div className="absolute z-20 px-2 py-1 mb-2 text-xs text-white transition-opacity duration-200 transform -translate-x-1/2 bg-gray-800 rounded opacity-0 pointer-events-none bottom-full left-1/2 group-hover:opacity-100 whitespace-nowrap">
                    Chọn vị trí để di chuyển
                    <div className="absolute transform -translate-x-1/2 top-full left-1/2"></div>
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
      width: '20%',
      onHeaderCell: () => ({
        style: { textAlign: 'center' as const }
      }),
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'itemName',
      key: 'itemName',
      width: '35%',
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
      title: 'Vị trí hiện tại',
      key: 'currentLocation',
      width: '30%',
      align: 'center' as const,
      render: (record: ImportOrderDetailResponse) => {
        const itemInventories = inventoryItems.filter(inv => inv.itemId === record.itemId.toString());

        // Lấy vị trí của item đầu tiên (vì tất cả cùng itemId sẽ ở cùng vị trí)
        const firstItem = itemInventories[0];

        return (
          <div className="font-medium">
            {convertStoredLocationName(firstItem.storedLocationName)}
          </div>
        );
      },
    },
  ];

  const handleOnUpdateInventoryItemsLocationConfirm = async () => {
    if (!selectingLocationId) return;

    const selectedLocation = findLocationById(selectingLocationId);
    if (!selectedLocation) return;

    const changedInventoryItems = inventoryItems.filter(
      inv => inv.itemId === selectedItem?.itemId.toString()
    ).map(item => ({
      inventoryItemId: item.id,
      storedLocationId: selectedLocation.id
    }));

    // Chỉ gọi API nếu có thay đổi
    if (changedInventoryItems.length > 0) {
      await onUpdateInventoryItemsLocationConfirm(changedInventoryItems);
    }

    setInventoryItemsLocationConfirmModalOpen(false);
    setInventoryItemsLocationResponsibilityChecked(false);
    setSelectingLocationId(null);
    setSuggestedLocations([]);
    onClose();
  };

  const handleOnClose = () => {
    setSelectingLocationId(null);
    setSuggestedLocations([]);
    onClose();
  };

  const handleLocationClick = (location: StoredLocationResponse) => {
    if (selectingLocationId === location.id) {
      // Nếu click lại vị trí đã chọn thì bỏ chọn
      setSelectingLocationId(null);
    } else {
      // Chọn vị trí mới
      setSelectingLocationId(location.id);
    }
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
            <p className="text-base text-blue-900">Vui lòng chọn vị trí để cập nhật cho sản phẩm này</p>
            {selectingLocationId &&  (
              <div className="p-2 mt-2 border border-orange-300 rounded-md bg-orange-50">
                <p className="text-sm font-medium text-blue-800">
                  {}
                  Vị trí được chọn: <span className="font-bold">#{getFullLocationName(findLocationById(selectingLocationId))}</span>
                </p>
                <Button
                  type="primary"
                  onClick={handleInventoryItemsLocationConfirm}
                  disabled={!selectingLocationId}
                  className="mt-1"
                >
                  Xác nhận vị trí mới
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
          </Button>
        ]}
        width={1180}
        styles={{
          content: { minWidth: "1080px" },
          body: { overflowY: "auto", maxHeight: "70vh" },
        }}
      >
        <div className="space-y-6">
          {/* Hiển thị thông tin sản phẩm được chọn */}
          {selectedItem && (
            <Table
              columns={columns}
              dataSource={[selectedItem]}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          )}

          {/* Sơ đồ kho */}
          <div className="space-y-4" data-warehouse-map>
            {floors.map(floor => {
              // Kiểm tra xem floor này có suggested locations không
              const hasDataForFloor = zones.some(zone => {
                const zoneFloorData = warehouseData[zone]?.[floor];
                if (!zoneFloorData) return false;

                return Object.values(zoneFloorData).some(rowData =>
                  Object.values(rowData).some(location =>
                    location && suggestedLocations.some(suggested => suggested.id === location.id)
                  )
                );
              });

              if (!hasDataForFloor) return null;

              // Tính số zones thực tế có suggested locations cho floor này
              const activeZonesForFloor = zones.filter(zone => {
                const zoneFloorData = warehouseData[zone]?.[floor];
                if (!zoneFloorData) return false;

                return Object.values(zoneFloorData).some(rowData =>
                  Object.values(rowData).some(location =>
                    location && suggestedLocations.some(suggested => suggested.id === location.id)
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
                      // Kiểm tra zone-floor này có suggested locations không
                      const zoneFloorData = warehouseData[zone]?.[floor];
                      if (!zoneFloorData) return null;

                      const hasRelevantLocations = Object.values(zoneFloorData).some(rowData =>
                        Object.values(rowData).some(location =>
                          location && suggestedLocations.some(suggested => suggested.id === location.id)
                        )
                      );

                      if (!hasRelevantLocations) return null;

                      return renderZoneFloor(zone, floor);
                    })}
                  </div>
                </div>
              );
            })}

            {/* Hiển thị loading khi đang fetch suggested locations */}
            {loadingSuggestion && (
              <div className="py-8 text-center">
                <Spin size="large" />
                <p className="mt-4 text-lg text-gray-600">Đang cập nhật vị trí kho...</p>
                <p className="mt-2 text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal xác nhận cập nhật vị trí sản phẩm */}
      <Modal
        title={
          <div className="text-center">
            <h3 className="text-lg font-bold">Thực hiện cập nhật vị trí cho #{selectedItem?.itemId}</h3>
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
            Tôi xác nhận cập nhật vị trí cho #{selectedItem?.itemId}
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
                Tôi đã kiểm tra kĩ và xác nhận cập nhật vị trí cho #{selectedItem?.itemId}.
              </span>
            </Checkbox>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UpdateInventoryItemLocationModal; 