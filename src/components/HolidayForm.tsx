import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormGroup, FormControlLabel, Switch, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Holiday, HolidayType } from '../models/holiday';
import { useEffect } from 'react';
import { format } from 'date-fns';

interface HolidayFormProps {
  open: boolean;
  onClose: () => void;
  holiday: Holiday | null;
  onSave: (data: HolidayFormData) => void;
}

export interface HolidayFormData {
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
  excludeFromScheduling: boolean;
}

const HolidayForm: React.FC<HolidayFormProps> = ({ open, onClose, holiday, onSave }) => {
  const isEdit = !!holiday;
  const { control, handleSubmit, reset } = useForm<HolidayFormData>();

  useEffect(() => {
    if (open) {
      if (isEdit) {
        reset({
          name: holiday.name,
          date: holiday.date,
          type: holiday.type,
          excludeFromScheduling: holiday.excludeFromScheduling,
        });
      } else {
        reset({
          name: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'national',
          excludeFromScheduling: true,
        });
      }
    }
  }, [open, isEdit, holiday, reset]);

  const onSubmit: SubmitHandler<HolidayFormData> = (data) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? '編輯假日' : '新增假日'}</DialogTitle>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField {...field} autoFocus margin="dense" label="假日名稱" fullWidth variant="outlined" sx={{ mb: 2 }} />
            )}
          />
          <Controller
            name="date"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField {...field} margin="dense" label="日期" type="date" fullWidth variant="outlined" sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
            )}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="type-select-label">類型</InputLabel>
            <Controller
              name="type"
              control={control}
              defaultValue="national"
              render={({ field }) => (
                <Select {...field} labelId="type-select-label" label="類型">
                  <MenuItem value="national">國定假日</MenuItem>
                  <MenuItem value="weekend">週末</MenuItem>
                </Select>
              )}
            />
          </FormControl>
          <FormGroup>
            <Controller
              name="excludeFromScheduling"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="不排班"
                />
              )}
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="contained">
            {isEdit ? '儲存變更' : '新增'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default HolidayForm;
