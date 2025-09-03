import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Employee } from '../models/employee';
import type { Shift } from '../models/shift';
import type { ShiftAssignment } from '../models/schedule';
import { employeeService } from '../services/employeeService';
import { createShiftChangeRequest } from '../services/shiftChangeService';

interface ShiftChangeRequestDialogProps {
  open: boolean;
  onClose: () => void;
  scheduleDate: string; // YYYY-MM-DD
  shift: Shift;
  assignment: ShiftAssignment;
}

interface IFormInput {
  type: 'cover' | 'swap';
  targetCovererId: string;
  targetSwapperId: string;
  targetSwapDate: string;
  targetSwapShift: Shift;
  requesterNotes: string;
}

const ShiftChangeRequestDialog: React.FC<ShiftChangeRequestDialogProps> = ({
  open,
  onClose,
  scheduleDate,
  shift,
  assignment,
}) => {
  const { control, handleSubmit, reset, setValue } = useForm<IFormInput>({
    defaultValues: {
      type: 'cover',
      targetCovererId: '',
      targetSwapperId: '',
      targetSwapDate: '',
      targetSwapShift: 'noon',
      requesterNotes: '',
    },
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabValue, setTabValue] = useState<'cover' | 'swap'>('cover');

  // const selectedType = watch('type'); // 暫時不使用

  useEffect(() => {
    if (open) {
      const fetchEmployees = async () => {
        setIsLoading(true);
        try {
          // Fetch employees who can work this shift, excluding the current user
          const allEmployees = await employeeService.getEmployees();
          const eligibleEmployees = allEmployees.filter(
            emp => emp.id !== assignment.employeeId && emp.roles[shift] && emp.isActive
          );
          setEmployees(eligibleEmployees);
        } catch (error) {
          console.error('Failed to fetch employees', error);
        }
        setIsLoading(false);
      };
      fetchEmployees();
      reset(); // Reset form on open
      setTabValue('cover');
    }
  }, [open, shift, assignment.employeeId, reset]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'cover' | 'swap') => {
    setTabValue(newValue);
    // 同步更新表單的 type 欄位
    setValue('type', newValue);
  };
  
  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    console.log('Form submitted with data:', data);
    console.log('Schedule date:', scheduleDate);
    console.log('Shift:', shift);
    console.log('Assignment:', assignment);
    
    try {
        if (data.type === 'cover' && !data.targetCovererId) {
            alert('請選擇代班人');
            return;
        }

        if (data.type === 'swap') {
            if (!data.targetSwapperId) {
                alert('請選擇交換對象');
                return;
            }
            if (!data.targetSwapDate) {
                alert('請選擇對方的班次日期');
                return;
            }
            if (!data.targetSwapShift) {
                alert('請選擇對方的班別');
                return;
            }
        }

        const requestData: any = {
            requesterId: assignment.employeeId,
            originalDate: scheduleDate,
            originalShift: shift,
            type: data.type,
        };

        // 只加入有值的欄位，避免 undefined
        if (data.type === 'cover' && data.targetCovererId) {
            requestData.targetCovererId = data.targetCovererId;
        }
        
        if (data.type === 'swap') {
            if (data.targetSwapperId) requestData.targetSwapperId = data.targetSwapperId;
            if (data.targetSwapDate) requestData.targetSwapDate = data.targetSwapDate;
            if (data.targetSwapShift) requestData.targetSwapShift = data.targetSwapShift;
        }
        
        if (data.requesterNotes && data.requesterNotes.trim()) {
            requestData.requesterNotes = data.requesterNotes.trim();
        }

        await createShiftChangeRequest(requestData);
        alert('申請已送出');
        onClose();
    } catch (error) {
        console.error('Failed to create shift change request', error);
        alert(`申請失敗：${error instanceof Error ? error.message : '未知錯誤'}，請檢查控制台獲取更多資訊`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>申請換班或代班</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="找人代班" value="cover" />
            <Tab label="與人換班" value="swap" />
          </Tabs>

          {tabValue === 'cover' && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                請選擇一位同事來代替您這個班次。
              </Typography>
              {isLoading ? (
                <CircularProgress />
              ) : (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="target-coverer-label">選擇代班人</InputLabel>
                  <Controller
                    name="targetCovererId"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select labelId="target-coverer-label" label="選擇代班人" {...field}>
                        {employees.map(emp => (
                          <MenuItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              )}
            </Box>
          )}

          {tabValue === 'swap' && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                請選擇要與您交換班次的同事，以及對方的班次。
              </Typography>
              {isLoading ? (
                <CircularProgress />
              ) : (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="target-swapper-label">選擇交換對象</InputLabel>
                    <Controller
                      name="targetSwapperId"
                      control={control}
                      rules={{ required: tabValue === 'swap' }}
                      render={({ field }) => (
                        <Select labelId="target-swapper-label" label="選擇交換對象" {...field}>
                          {employees.map(emp => (
                            <MenuItem key={emp.id} value={emp.id}>
                              {emp.name}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>

                  <TextField
                    label="對方的班次日期"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    {...control.register('targetSwapDate', { 
                      required: tabValue === 'swap' 
                    })}
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="target-shift-label">對方的班別</InputLabel>
                    <Controller
                      name="targetSwapShift"
                      control={control}
                      rules={{ required: tabValue === 'swap' }}
                      render={({ field }) => (
                        <Select labelId="target-shift-label" label="對方的班別" {...field}>
                          <MenuItem value="morning">早班</MenuItem>
                          <MenuItem value="noon">午班</MenuItem>
                          <MenuItem value="afternoon">晚班</MenuItem>
                          <MenuItem value="phone">電話班</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </>
              )}
            </Box>
          )}

          <TextField
            label="備註"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            {...control.register('requesterNotes')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="contained">
            送出申請
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ShiftChangeRequestDialog;
