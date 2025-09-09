import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Box, Typography } from '@mui/material';
import type { Employee } from '../models/employee';
import type { DailySchedule } from '../models/schedule';
import type { Shift } from '../models/shift';
import { useState, useEffect } from 'react';
import { schedulingService } from '../services/schedulingService';

interface ScheduleEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (newEmployeeId: string) => void;
  schedule: DailySchedule | null;
  shiftToEdit: Shift | null;
  allEmployees: Employee[];
}

const ScheduleEditDialog = ({ open, onClose, onSave, schedule, shiftToEdit, allEmployees }: ScheduleEditDialogProps) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [candidates, setCandidates] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentAssignment = schedule && shiftToEdit ? schedule.shifts[shiftToEdit] : null;

  useEffect(() => {
    if (open && schedule && shiftToEdit) {
      setIsLoading(true);
      
      try {
        // 找到目前負責該班次的員工
        const currentEmployee = allEmployees.find(e => e.id === currentAssignment?.employeeId);
        
        // 使用 schedulingService 找出所有可能的候選人
        // 這裡不再直接調用 getCandidates，而是先檢查 schedulingService 是否已初始化
        let potentialCandidates: Employee[] = [];
        
        try {
          // 嘗試獲取候選人
          potentialCandidates = schedulingService.getCandidates(shiftToEdit, new Date(schedule.date), []);
        } catch (error) {
          console.error("獲取候選人失敗:", error);
          // 如果獲取失敗，至少顯示所有有該班別角色的員工
          potentialCandidates = allEmployees.filter(e => e.roles[shiftToEdit] && e.isActive);
        }
        
        // 如果沒有候選人（例如從缺班別），顯示所有有該班別角色的員工
        if (potentialCandidates.length === 0) {
          potentialCandidates = allEmployees.filter(e => e.roles[shiftToEdit] && e.isActive);
        }
        
        // 確保目前的員工也在候選清單中（即使他不符合某些新規則，也應該能被選中）
        if (currentEmployee && !potentialCandidates.some(c => c.id === currentEmployee.id)) {
          potentialCandidates.unshift(currentEmployee);
        }
        
        setCandidates(potentialCandidates);
        setSelectedEmployeeId(currentAssignment?.employeeId || '');
      } catch (error) {
        console.error("處理候選人時發生錯誤:", error);
        // 發生錯誤時，至少顯示所有員工
        setCandidates(allEmployees);
      } finally {
        setIsLoading(false);
      }
    }
  }, [open, schedule, shiftToEdit, currentAssignment, allEmployees]);

  const handleSave = () => {
    if (selectedEmployeeId) {
      onSave(selectedEmployeeId);
    }
    onClose();
  };
  
  const shiftNames: Record<string, string> = {
    'noon': '諮詢台值午', 
    'phone': '諮詢電話', 
    'morning': '上午支援', 
    'afternoon': '下午支援',
    'verify1': '處方審核(主)',
    'verify2': '處方審核(輔)'
  };

  const isVacant = !currentAssignment;
  const dialogTitle = isVacant ? '指定人員' : '編輯班次';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {dialogTitle} - {schedule ? new Date(schedule.date).toLocaleDateString() : ''}
        <Typography variant="body1" color="text.secondary">
          {shiftToEdit ? shiftNames[shiftToEdit] : ''}
        </Typography>
        {isVacant && (
          <Typography variant="body2" color="error">
            此班別目前從缺，請選擇人員
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="employee-select-label">選擇員工</InputLabel>
            <Select
              labelId="employee-select-label"
              value={selectedEmployeeId}
              label="選擇員工"
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {candidates.map(emp => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
              {candidates.length === 0 && (
                <MenuItem disabled>無可用員工</MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={!selectedEmployeeId || selectedEmployeeId === currentAssignment?.employeeId}>
          {isVacant ? '指定人員' : '儲存變更'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleEditDialog;
