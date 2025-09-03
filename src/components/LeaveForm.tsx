import React, { useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Leave, LeaveType } from '../models/leave';
import type { Employee } from '../models/employee';
import { format } from 'date-fns';

export interface LeaveFormData {
  employeeId: string;
  leaveType: LeaveType;
  startTime: string;
  endTime: string;
  reason: string;
}

interface LeaveFormProps {
  open: boolean;
  onClose: () => void;
  leave?: Leave | null;
  employees: Employee[];
  onSave: (data: LeaveFormData, id?: string) => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ open, onClose, leave, employees, onSave }) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>();

  useEffect(() => {
    if (leave) {
      // 編輯模式：填入現有資料
      reset({
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        startTime: format(leave.startTime, "yyyy-MM-dd'T'HH:mm"),
        endTime: format(leave.endTime, "yyyy-MM-dd'T'HH:mm"),
        reason: leave.reason,
      });
    } else {
      // 新增模式：填入預設值
      reset({
        employeeId: '',
        leaveType: 'annual',
        startTime: format(new Date(), "yyyy-MM-dd'T'09:00"),
        endTime: format(new Date(), "yyyy-MM-dd'T'18:00"),
        reason: '',
      });
    }
  }, [leave, reset]);

  const onSubmit: SubmitHandler<LeaveFormData> = (data) => {
    onSave(data, leave?.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{leave ? '編輯請假' : '新增請假'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <FormControl fullWidth margin="dense" error={!!errors.employeeId}>
            <InputLabel>員工</InputLabel>
            <Controller
              name="employeeId"
              control={control}
              rules={{ required: '員工為必填項' }}
              render={({ field }) => (
                <Select {...field} label="員工">
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <Controller
            name="startTime"
            control={control}
            rules={{ required: '開始時間為必填項' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="開始時間"
                type="datetime-local"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={!!errors.startTime}
                helperText={errors.startTime?.message}
              />
            )}
          />

          <Controller
            name="endTime"
            control={control}
            rules={{ required: '結束時間為必填項' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="結束時間"
                type="datetime-local"
                fullWidth
                margin="dense"
                InputLabelProps={{ shrink: true }}
                error={!!errors.endTime}
                helperText={errors.endTime?.message}
              />
            )}
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>請假類型</InputLabel>
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <Select {...field} label="請假類型">
                  <MenuItem value="annual">特休</MenuItem>
                  <MenuItem value="sick">病假</MenuItem>
                  <MenuItem value="personal">事假</MenuItem>
                  <MenuItem value="meeting">會議</MenuItem>
                  <MenuItem value="other_duty">其他值班</MenuItem>
                  <MenuItem value="compensatory_leave">排班補休</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          <Controller
            name="reason"
            control={control}
            rules={{ required: '事由為必填項' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="事由"
                multiline
                rows={3}
                fullWidth
                margin="dense"
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="contained">
            儲存
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LeaveForm;
