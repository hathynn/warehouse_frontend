import { Card, Typography } from "antd";

type StatisticCardProps = {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
};

const { Text } = Typography;


const StatisticCard: React.FC<StatisticCardProps> = ({
    title,
    value,
    icon,
    color,
}) => (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
                    <Text className="font-medium !text-base">
                        {title}
                    </Text>
                </div>
                <div className="space-y-1">
                    <div className="text-xl font-bold text-gray-900 flex justify-end">
                        <span className="text-xl">{value?.toLocaleString() || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    </Card>
);

export default StatisticCard;