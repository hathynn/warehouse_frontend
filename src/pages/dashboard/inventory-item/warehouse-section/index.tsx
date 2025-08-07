import React, { useState, useEffect, useMemo } from 'react';
import { Select, Card, Typography } from 'antd';
import useStoredLocationService, { StoredLocationResponse } from '@/services/useStoredLocationService';

const { Title } = Typography;

const WarehouseSection: React.FC = () => {
  const [highlightedInventoryItemIds, setHighlightedInventoryItemIds] = useState<string[]>([]);
  const [storedLocationData, setStoredLocationData] = useState<StoredLocationResponse[]>([]);

  const { getAllStoredLocations, loading: storedLocationLoading } = useStoredLocationService();

  useEffect(() => {
    const fetchData = async () => {
      const locationsResponse = await getAllStoredLocations();
      if (locationsResponse) {
        setStoredLocationData(locationsResponse.content || []);
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

    const isHighlightedByInventorySearch = highlightedInventoryItemIds.length > 0 && location.inventoryItemIds && highlightedInventoryItemIds.some(id => location.inventoryItemIds.includes(id));

    if (location.isDoor == true) {
      if (isHighlightedByInventorySearch) {
        return 'bg-yellow-400 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      return 'bg-yellow-400';
    }
    if (location.isRoad == true) {
      if (isHighlightedByInventorySearch) {
        return 'bg-blue-200 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      return 'bg-blue-200';
    }
    if (location.currentCapacity > 0) {
      if (isHighlightedByInventorySearch) {
        return 'bg-green-300 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
      }
      return 'bg-green-300';
    }

    if (isHighlightedByInventorySearch) {
      return 'bg-gray-50 ring-8 ring-orange-500 ring-opacity-90 shadow-2xl shadow-orange-400 transform scale-110 z-10 relative border-2 border-orange-600';
    }
    return 'bg-gray-50';
  };

  const getCellText = (location: StoredLocationResponse | undefined) => {
    if (!location) return '';
    if (location.isDoor == true) return 'CỬA';
    if (location.isRoad == true) return 'LỐI ĐI';
    if (location.maximumCapacityForItem > 0) {
      return `${location.currentCapacity}/${location.maximumCapacityForItem}`;
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
              const isHighlightedByInventorySearch = highlightedInventoryItemIds.length > 0 && location?.inventoryItemIds && highlightedInventoryItemIds.some(id => location.inventoryItemIds.includes(id));
              
              let boxShadowStyle = {};
              if (isHighlightedByInventorySearch) {
                boxShadowStyle = {
                  boxShadow: '0 0 30px rgba(249, 115, 22, 0.8), inset 0 0 20px rgba(249, 115, 22, 0.3)',
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
                    <div className="text-[12px]">{getCellText(location)}</div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };


  const handleInventorySearchChange = (value: string[]) => {
    setHighlightedInventoryItemIds(value);

    if (value.length > 0) {
      const location = storedLocationData.find(loc => loc.inventoryItemIds && loc.inventoryItemIds.some(id => value.includes(id)));
      if (location) {
        const floorElement = document.getElementById(`floor-${location.floor}`);
        if (floorElement) {
          floorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };


  const inventoryItemsInWarehouse = useMemo(() => {
    return storedLocationData.flatMap(loc => loc.inventoryItemIds || []).filter(Boolean);
  }, [storedLocationData]);
  
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            loading={storedLocationLoading}
            maxTagCount="responsive"
            dropdownStyle={{ 
              maxHeight: '240px', 
            }}
            listHeight={160}
          />
        </div>
      </Card>

      {storedLocationLoading ? renderFloorsLoading() : renderFloors()}
    </div>
  );
};

export default WarehouseSection; 