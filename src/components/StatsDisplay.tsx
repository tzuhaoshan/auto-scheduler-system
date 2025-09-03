import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { Employee } from '../models/employee';

interface StatsDisplayProps {
  title: string;
  stats: Record<string, Record<string, number>>;
  employees: Employee[];
}

const StatsDisplay = ({ title, stats, employees }: StatsDisplayProps) => {
  const employeeMap = new Map(employees.map(e => [e.id, e.name]));

  const shiftNames: Record<string, string> = {
    'noon': '諮詢台值午',
    'phone': '諮詢電話',
    'morning': '上午支援',
    'afternoon': '下午支援'
  };

  if (!stats || Object.keys(stats).length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" color="text.secondary">暫無資料</Typography>
      </Paper>
    );
  }

  // 確保有表頭可以顯示
  const headers = Object.keys(shiftNames);

  return (
    <Paper sx={{ p: 2, overflowX: 'auto' }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>員工</TableCell>
              {headers.map(shift => (
                <TableCell key={shift} align="center" sx={{ fontWeight: 'bold' }}>
                  {shiftNames[shift] || shift}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(stats).map(([employeeId, shiftCounts]) => (
              <TableRow key={employeeId}>
                <TableCell>{employeeMap.get(employeeId) || '未知員工'}</TableCell>
                {headers.map(shift => (
                  <TableCell key={shift} align="center">
                    {shiftCounts[shift] || 0}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default StatsDisplay;
