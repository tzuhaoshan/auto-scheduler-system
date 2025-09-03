import { Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState } from 'react';
import type { Holiday } from '../models/holiday';
import { holidayService } from '../services/holidayService';
import { format } from 'date-fns';
import HolidayForm from '../components/HolidayForm';
import type { HolidayFormData } from '../components/HolidayForm';

const HolidayManagementPage = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidayService.getHolidays();
      setHolidays(data);
    } catch (error) {
      console.error("無法獲取假日資料:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenForm = (holiday: Holiday | null) => {
    setSelectedHoliday(holiday);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedHoliday(null);
  };

  const handleSave = async (data: HolidayFormData) => {
    try {
      if (selectedHoliday) {
        await holidayService.updateHoliday(selectedHoliday.id, data);
      } else {
        await holidayService.addHoliday(data);
      }
      fetchHolidays(); // Refresh list
    } catch (error) {
      console.error("儲存假日失敗:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這個假日嗎？')) {
      try {
        await holidayService.deleteHoliday(id);
        fetchHolidays(); // Refresh list
      } catch (error) {
        console.error("刪除假日失敗:", error);
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          假日管理
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm(null)}>
          新增假日
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="holiday table">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>名稱</TableCell>
                <TableCell>類型</TableCell>
                <TableCell>是否排班</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>{format(new Date(holiday.date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>{holiday.name}</TableCell>
                  <TableCell>{holiday.type === 'national' ? '國定假日' : '週末'}</TableCell>
                  <TableCell>{holiday.excludeFromScheduling ? '是' : '否'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenForm(holiday)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(holiday.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <HolidayForm
        open={isFormOpen}
        onClose={handleCloseForm}
        holiday={selectedHoliday}
        onSave={handleSave}
      />
    </Container>
  );
};

export default HolidayManagementPage;
