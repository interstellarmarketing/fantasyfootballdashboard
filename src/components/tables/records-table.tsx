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
        <div className="card card--gradient rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 sm:px-5 py-3 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="relative w-full overflow-auto px-2 py-2 sm:px-4 sm:py-4">
                <table className="table">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className={header === 'Year' || header === 'Value' || header === 'Score' || header === 'Margin' ? 'text-center' : ''}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record, index) => {
                            const rowColor = getRowColor(record, index);
                            const valueDisplay = getValueDisplay(record);
                            
                            return (
                                <tr key={index} className={rowColor}>
                                    <td className="font-medium">
                                        {record.rank || index + 1}
                                    </td>
                                    {type === 'shootouts' || type === 'snoozers' ? (
                                        <>
                                            <td>
                                                <span className="break-words leading-6">{record.matchup}</span>
                                            </td>
                                            <td className="text-center">
                                                {record.year}
                                            </td>
                                            <td className="font-semibold text-center">
                                                {valueDisplay}
                                            </td>
                                        </>
                                    ) : type === 'blowouts' || type === 'nailbiters' ? (
                                        <>
                                            <td>
                                                <span className="break-words leading-6">{record.matchup}</span>
                                            </td>
                                            <td className="text-center">
                                                {record.year}
                                            </td>
                                            <td className="font-semibold text-center">
                                                {valueDisplay}
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>
                                                <span className="break-words leading-6">{record.team}</span>
                                            </td>
                                            <td className="text-center">
                                                {record.year}
                                            </td>
                                            <td className="font-semibold text-center">
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