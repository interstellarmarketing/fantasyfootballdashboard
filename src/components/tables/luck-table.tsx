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
                <thead className="bg-indigo-900">
                    <tr className="border-b border-black">
                        <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle font-medium text-indigo-100 whitespace-normal sm:whitespace-nowrap text-[11px] sm:text-xs">Rank</th>
                        <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle font-medium text-indigo-100 whitespace-normal sm:whitespace-nowrap text-[11px] sm:text-xs">Team</th>
                        <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-normal sm:whitespace-nowrap text-[11px] sm:text-xs">{title}</th>
                        <th className="h-10 sm:h-12 px-1.5 sm:px-2 text-center align-middle font-medium text-indigo-100 whitespace-normal sm:whitespace-nowrap text-[11px] sm:text-xs">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 [&_tr:last-child]:border-0">
                    {(luckData || []).map((item, index) => {
                        const luckValue = item.luck_index.toFixed(2);
                        const isLucky = item.luck_index > 0;
                        const luckTextColor = getLuckTextColor(item.luck_index);
                        const luckIcon = getLuckIcon(item.luck_index);

                        return (
                            <tr key={item.team_name} className="hover:bg-white/10 transition-colors border-b border-black">
                                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 sm:whitespace-nowrap whitespace-normal text-[12px] sm:text-sm font-medium text-white text-center">
                                    {index + 1}
                                </td>
                                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 sm:whitespace-nowrap whitespace-normal text-[12px] sm:text-sm font-medium text-white">
                                    <span className="break-words leading-6">{item.team_name}</span>
                                </td>
                                <td className={`py-1.5 sm:py-2 px-1 sm:px-1.5 sm:whitespace-nowrap whitespace-normal text-[12px] sm:text-sm font-semibold ${luckTextColor} text-center`}>
                                    {isLucky ? '+' : ''}{luckValue}
                                </td>
                                <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 sm:whitespace-nowrap whitespace-normal text-[12px] sm:text-sm text-white/90 text-center">
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