'use client';

interface Record {
    rank?: number;
    matchup?: string;
    team?: string;
    year: number;
    value: number;
    score?: string;
    margin?: string;
}

interface RecordsTableProps {
    records: Record[];
    title: string;
    type: 'shootouts' | 'snoozers' | 'blowouts' | 'nailbiters' | 'top-scores' | 'low-scores';
}

export default function RecordsTable({ records, title, type }: RecordsTableProps) {
    const getHeaders = () => {
        switch (type) {
            case 'shootouts':
            case 'snoozers':
                return ['Rank', 'Matchup', 'Year', 'Score'];
            case 'blowouts':
            case 'nailbiters':
                return ['Rank', 'Matchup', 'Year', 'Margin'];
            case 'top-scores':
            case 'low-scores':
                return ['Rank', 'Team', 'Year', 'Score'];
            default:
                return ['Rank', 'Team', 'Year', 'Value'];
        }
    };

    const getValueDisplay = (record: Record) => {
        switch (type) {
            case 'shootouts':
            case 'snoozers':
                return record.score || record.value.toFixed(2);
            case 'blowouts':
            case 'nailbiters':
                return record.margin || record.value.toFixed(2);
            case 'top-scores':
            case 'low-scores':
                return record.value.toFixed(2);
            default:
                return record.value.toFixed(2);
        }
    };

    const getRowColor = (record: Record, index: number) => {
        if (index === 0) return 'border-l-4 border-yellow-400';
        if (index === 1) return 'border-l-4 border-gray-400';
        if (index === 2) return 'border-l-4 border-orange-400';
        return '';
    };

    const headers = getHeaders();

    return (
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 sm:px-5 py-3 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
                <table className="w-full table-auto caption-bottom text-[12px] sm:text-sm">
                    <thead className="bg-indigo-900">
                        <tr className="border-b border-black">
                            {headers.map((header) => (
                                <th 
                                    key={header}
                                    className="h-10 sm:h-12 px-1.5 sm:px-2 text-left align-middle text-indigo-100 uppercase tracking-wider font-medium text-[11px] sm:text-xs"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 [&_tr:last-child]:border-0">
                        {records.map((record, index) => {
                            const rowColor = getRowColor(record, index);
                            const valueDisplay = getValueDisplay(record);
                            
                            return (
                                <tr key={index} className={`${rowColor} hover:bg-white/10 transition-colors border-b border-black`}>
                                    <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm font-medium text-white text-left">
                                        {record.rank || index + 1}
                                    </td>
                                    {type === 'shootouts' || type === 'snoozers' ? (
                                        <>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white">
                                                <span className="break-words leading-6">{record.matchup}</span>
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white/70">
                                                {record.year}
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm font-semibold text-white">
                                                {valueDisplay}
                                            </td>
                                        </>
                                    ) : type === 'blowouts' || type === 'nailbiters' ? (
                                        <>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white">
                                                <span className="break-words leading-6">{record.matchup}</span>
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white/70">
                                                {record.year}
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm font-semibold text-white">
                                                {valueDisplay}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white">
                                                <span className="break-words leading-6">{record.team}</span>
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm text-white/70">
                                                {record.year}
                                            </td>
                                            <td className="py-1.5 sm:py-2 px-1 sm:px-1.5 text-[12px] sm:text-sm font-semibold text-white">
                                                {valueDisplay}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 