'use client';

interface LuckData {
    team_name: string;
    luck_index: number;
}

interface LuckTableProps {
    luckData: LuckData[];
    title?: string;
}

export default function LuckTable({ luckData, title = "Luck Index" }: LuckTableProps) {
    const getLuckTextColor = (luckIndex: number) => {
        if (luckIndex >= 2) return 'text-green-300';
        if (luckIndex >= 1) return 'text-green-300';
        if (luckIndex >= 0) return 'text-yellow-300';
        if (luckIndex >= -1) return 'text-orange-300';
        return 'text-red-300';
    };

    const getLuckIcon = (luckIndex: number) => {
        if (luckIndex >= 2) return '🍀';
        if (luckIndex >= 1) return '😊';
        if (luckIndex >= 0) return '😐';
        if (luckIndex >= -1) return '😕';
        return '😭';
    };

    return (
        <div className="relative w-full overflow-auto card card--gradient rounded-lg shadow-lg px-2 py-4 sm:px-4 sm:py-6">
            <table className="table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th className="text-center">{title}</th>
                        <th className="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {(luckData || []).map((item, index) => {
                        const luckValue = item.luck_index.toFixed(2);
                        const isLucky = item.luck_index > 0;
                        const luckTextColor = getLuckTextColor(item.luck_index);
                        const luckIcon = getLuckIcon(item.luck_index);

                        return (
                            <tr key={item.team_name}>
                                <td className="text-center font-medium">
                                    {index + 1}
                                </td>
                                <td className="font-medium">
                                    <span className="break-words leading-6">{item.team_name}</span>
                                </td>
                                <td className={`font-semibold text-center ${luckTextColor}`}>
                                    {isLucky ? '+' : ''}{luckValue}
                                </td>
                                <td className="text-center">
                                    <span className="text-lg">{luckIcon}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
} 