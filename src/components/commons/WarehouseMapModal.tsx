import React from 'react';
import { Modal, Button } from 'antd';
import { InventoryItemResponse } from '@/services/useInventoryItemService';
import { StoredLocationResponse } from '@/services/useStoredLocationService';

interface WarehouseMapModalProps {
    inventoryItems: InventoryItemResponse[];
    storedLocationData: StoredLocationResponse[];
    loading: boolean;
    open: boolean;
    onClose: () => void;
}

const WarehouseMapModal: React.FC<WarehouseMapModalProps> = ({ open, onClose, inventoryItems, storedLocationData, loading }) => {
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
        if (location.isDoor == true) return 'bg-yellow-400'; // Cửa
        if (location.isRoad == true) return 'bg-blue-200'; // Đường đi
        if (location.currentCapacity > 0) return 'bg-green-300'; // Có sản phẩm
        return 'bg-gray-50'; // Không có trong kho
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
                            return (
                                <div
                                    key={`${zone}-${floor}-${row}-${line}`}
                                    className={`w-12 h-12 border border-gray-300 flex items-center justify-center text-xs font-medium ${getCellColor(location)}`}
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

    return (
        <Modal
            title={
                <div className="text-center">
                    <h3 className="text-xl font-bold text-blue-900">Sơ đồ kho</h3>
                    <p className="text-sm text-gray-600 mt-1">Bản đồ vị trí lưu trữ trong kho</p>
                </div>
            }
            open={open}
            loading={loading}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>
            ]}
            width={1080}
            styles={{
                content: { minWidth: "1080px" },
                body: { overflowY: "auto", maxHeight: "64vh" },
            }}
        >
            <div className="space-y-4">
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
                <div className="space-y-6">
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
    );
};

export default WarehouseMapModal; 