import React, { useState, useEffect, useMemo } from 'react';
import { Select, Card, Typography, Row, Col } from 'antd';
import useStoredLocationService, { StoredLocationResponse } from '@/services/useStoredLocationService';
import useItemService, { ItemResponse } from '@/services/useItemService';
import useInventoryItemService, { InventoryItemResponse } from '@/services/useInventoryItemService';

const { Title } = Typography;

const WarehouseSection: React.FC = () => {
  const [highlightedItemIds, setHighlightedItemIds] = useState<string[]>([]);
  const [highlightedInventoryItemIds, setHighlightedInventoryItemIds] = useState<string[]>([]);
  const [storedLocationData, setStoredLocationData] = useState<StoredLocationResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemResponse[]>([]);

  const { getAllStoredLocations, loading: storedLocationLoading } = useStoredLocationService();
  const { getItems, loading: itemsLoading } = useItemService();
  const { getAllInventoryItems, loading: inventoryItemsLoading } = useInventoryItemService();

  useEffect(() => {
    const fetchData = async () => {
      const locationsResponse = await getAllStoredLocations();
      if (locationsResponse) {
        setStoredLocationData(locationsResponse.content || []);
      }
      const itemsResponse = await getItems();
      if (itemsResponse?.content) {
        setItems(itemsResponse.content);
      }
      const inventoryItemsResponse = await getAllInventoryItems();
      if (inventoryItemsResponse?.content) {
        setInventoryItems(inventoryItemsResponse.content);
      }
    };
    fetchData();
  }, []);

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

  const getCellColor = (location: StoredLocationResponse | undefined) => {
    if (!location) return 'bg-gray-300';

    // Check if this location should be highlighted (either by item search or inventory id search)
    const isHighlightedByItemSearch = highlightedItemIds.length > 0 && location.itemId && highlightedItemIds.includes(location.itemId);
    const isHighlightedByInventorySearch = highlightedInventoryItemIds.length > 0 && location.inventoryItemIds && highlightedInventoryItemIds.some(id => location.inventoryItemIds.includes(id));

    if (location.isDoor == true) {
      if (isHighlightedByInventorySearch) {
        return 'bg-yellow-400 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      if (isHighlightedByItemSearch) {
        return 'bg-yellow-400 ring-8 ring-yellow-500 ring-opacity-90 shadow-2xl shadow-yellow-400 transform scale-110 z-10 relative border-2 border-yellow-600';
      }
      return 'bg-yellow-400';
    }
    if (location.isRoad == true) {
      if (isHighlightedByInventorySearch) {
        return 'bg-blue-200 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      if (isHighlightedByItemSearch) {
        return 'bg-blue-200 ring-8 ring-yellow-500 ring-opacity-90 shadow-2xl shadow-yellow-400 transform scale-110 z-10 relative border-2 border-yellow-600';
      }
      return 'bg-blue-200';
    }
    if (location.currentCapacity > 0) {
      if (isHighlightedByInventorySearch) {
        return 'bg-green-300 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      if (isHighlightedByItemSearch) {
        return 'bg-green-300 ring-8 ring-yellow-500 ring-opacity-90 shadow-2xl shadow-yellow-400 transform scale-110 z-10 relative border-2 border-yellow-600';
      }
      return 'bg-green-300';
    }

    if (isHighlightedByInventorySearch) {
      return 'bg-gray-50 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
    }
    if (isHighlightedByItemSearch) {
      return 'bg-gray-50 ring-8 ring-yellow-500 ring-opacity-90 shadow-2xl shadow-yellow-400 transform scale-110 z-10 relative border-2 border-yellow-600';
    }
    return 'bg-gray-50';
  };

  const getCellText = (location: StoredLocationResponse | undefined) => {
    if (!location) return '';
    if (location.isDoor == true) return 'CỬA';
    if (location.isRoad == true) return 'LỐI ĐI';
    if (location.itemId) {
      if (location.currentCapacity === 0) {
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
        <div className="text-center font-bold text-base mb-2 bg-blue-100 rounded">
          KHU {zone}
        </div>
        <div className="grid grid-cols-4 gap-1 justify-items-center">
          {rows.map(row => (
            lines.map(line => {
              const location = warehouseData[zone]?.[floor]?.[row]?.[line];
              const isHighlightedByItemSearch = highlightedItemIds.length > 0 && location?.itemId && highlightedItemIds.includes(location.itemId);
              const isHighlightedByInventorySearch = highlightedInventoryItemIds.length > 0 && location?.inventoryItemIds && highlightedInventoryItemIds.some(id => location.inventoryItemIds.includes(id));
              
              let boxShadowStyle = {};
              if (isHighlightedByInventorySearch) {
                boxShadowStyle = {
                  boxShadow: '0 0 30px rgba(249, 115, 22, 0.8), inset 0 0 20px rgba(249, 115, 22, 0.3)',
                };
              } else if (isHighlightedByItemSearch) {
                boxShadowStyle = {
                  boxShadow: '0 0 30px rgba(234, 179, 8, 0.8), inset 0 0 20px rgba(234, 179, 8, 0.3)',
                };
              }

              return (
                <div
                  key={`${zone}-${floor}-${row}-${line}`}
                  className={`w-18 h-16 border border-gray-300 flex items-center justify-center text-xs font-medium transition-all duration-300 ${getCellColor(location)}`}
                  style={boxShadowStyle}
                >
                  <div className="text-center leading-tight">
                    <div className="text-[12px]">{location ? `${row}-${line}` : ''}</div>
                    <div className="text-[10px]">{getCellText(location)}</div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  const handleSearchChange = (itemIds: string[]) => {
    setHighlightedItemIds(itemIds);
    // Clear inventory search when using item search
    setHighlightedInventoryItemIds([]);

    if (itemIds.length > 0) {
      const firstItemId = itemIds[0];
      const location = storedLocationData.find(loc => loc.itemId === firstItemId);
      if (location) {
        const floorElement = document.getElementById(`floor-${location.floor}`);
        if (floorElement) {
          floorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const handleInventorySearchChange = (value: string[]) => {
    setHighlightedInventoryItemIds(value);
    // Clear item search when using inventory search
    setHighlightedItemIds([]);

    if (value) {
      // Find first matching location and scroll to it
      const location = storedLocationData.find(loc => loc.inventoryItemIds && loc.inventoryItemIds.some(id => value.includes(id)));
      if (location) {
        const floorElement = document.getElementById(`floor-${location.floor}`);
        if (floorElement) {
          floorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const itemsInWarehouse = useMemo(() => {
    const itemIdsInWarehouse = new Set(storedLocationData.map(loc => loc.itemId).filter(Boolean));
    return items.filter(item => itemIdsInWarehouse.has(item.id));
  }, [items, storedLocationData]);

  const itemSearchOptions = itemsInWarehouse.map(item => ({
    value: item.id,
    label: `${item.name} (${item.id})`,
  }));

  const inventoryItemsInWarehouse = useMemo(() => {
    return storedLocationData.flatMap(loc => loc.inventoryItemIds || []).filter(Boolean);
  }, [inventoryItems, storedLocationData]);
  
  const inventoryItemSearchOptions = inventoryItemsInWarehouse.map(inventoryItemId => {
    return {
      value: inventoryItemId,
      label: inventoryItemId,
    };
  });
  

  const renderFloorsLoading = () => {
    return (
      <div className="space-y-4 min-w-[1280px]">
        <div className="border-2 border-blue-300 p-2 rounded-lg bg-blue-50 animate-pulse">
          <div className="h-8 bg-blue-200 rounded mb-4 mx-auto w-32"></div>
          <div className="grid grid-cols-4 gap-2">
            {Array(4).fill(null).map((_, zoneIndex) => (
              <div key={zoneIndex} className="border border-gray-400 p-2">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="grid grid-cols-4 gap-1 justify-items-center">
                  {Array(16).fill(null).map((_, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFloors = () => {
    return (
      <div className="space-y-4 min-w-[1280px]">
        {floors.map(floor => (
          <div key={floor} id={`floor-${floor}`} className="border-2 border-blue-300 p-2 rounded-lg bg-blue-50">
            <h3 className="text-xl font-bold text-center text-blue-800">
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
    );
  };

  return (
    <div className="container mx-auto">
      <Title level={2}>Sơ đồ kho</Title>
      <Card>
        <Title level={4}>Tìm kiếm</Title>
        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm theo loại sản phẩm
              </label>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Gõ để tìm kiếm loại sản phẩm..."
                value={highlightedItemIds}
                onChange={handleSearchChange}
                onClear={() => setHighlightedItemIds([])}
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase()) ?? false
                }
                options={itemSearchOptions}
                allowClear
                loading={itemsLoading || storedLocationLoading}
                maxTagCount="responsive"
                dropdownStyle={{ 
                  maxHeight: '240px', 
                }}
                listHeight={160}
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm theo mã sản phẩm cụ thể
              </label>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Gõ để tìm kiếm mã sản phẩm cụ thể..."
                value={highlightedInventoryItemIds}
                onChange={handleInventorySearchChange}
                onClear={() => setHighlightedInventoryItemIds([])}
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase()) ?? false
                }
                options={inventoryItemSearchOptions}
                allowClear
                loading={storedLocationLoading || inventoryItemsLoading}
                dropdownStyle={{ 
                  maxHeight: '240px', 
                }}
                listHeight={160}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-sm justify-items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-300 border border-gray-300"></div>
            <span className="text-base">Có sản phẩm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white border border-gray-300"></div>
            <span className="text-base">Chưa có sản phẩm</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-200 border border-gray-300"></div>
            <span className="text-base">Lối đi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 border border-gray-300"></div>
            <span className="text-base">Cửa</span>
          </div>
        </div>
      </div>

      {storedLocationLoading || itemsLoading ? renderFloorsLoading() : renderFloors()}
    </div>
  );
};

export default WarehouseSection; 