import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, FormGroup, FormControlLabel, Checkbox, Switch, Typography, IconButton, List, ListItem, ListItemText, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller, useWatch } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import type { Employee, EmployeeConstraints } from '../models/employee';
import type { Shift } from '../models/shift';
import { useEffect, useState } from 'react';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null; // null for new employee
  onSave: (data: EmployeeFormData) => void;
}

const shifts: Shift[] = ['noon', 'phone', 'morning', 'afternoon', 'verify1', 'verify2'];
const weekDays = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

// 班別顯示名稱對應
const shiftDisplayNames: Record<Shift, string> = {
  noon: '諮詢台值午',
  phone: '諮詢電話',
  morning: '上午支援',
  afternoon: '下午支援',
  verify1: '處方審核(主)',
  verify2: '處方審核(輔)',
};

export interface EmployeeFormData {
  name: string;
  employeeId: string;
  roles: Record<Shift, boolean>;
  constraints: EmployeeConstraints;
  isActive: boolean;
}

const defaultPerShiftConstraints = {
  maxWeeklyShifts: 5,
  minInterval: 1,
  availableDays: [1, 2, 3, 4, 5],
  maxConsecutiveDays: 3,
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ open, onClose, employee, onSave }) => {
  const isEdit = !!employee;
  const { control, handleSubmit, reset, setValue } = useForm<EmployeeFormData>();
  
  // 不使用 useFieldArray，直接管理 unavailableDates 陣列
  const watchedUnavailableDates = useWatch({ control, name: 'constraints.unavailableDates' }) || [];

  const [newUnavailableDate, setNewUnavailableDate] = useState('');
  const [currentTab, setCurrentTab] = useState<Shift | 'general'>('general');

  const watchedRoles = useWatch({ control, name: 'roles' });
  
  const availableShifts = shifts.filter(shift => watchedRoles?.[shift]);

  useEffect(() => {
    if (open) {
      if (isEdit && employee) {
        // 確保 byShift 物件存在且包含所有角色的預設值
        const constraints = employee.constraints || {};
        constraints.byShift = constraints.byShift || {};
        shifts.forEach(shift => {
          if (employee.roles[shift] && !constraints.byShift[shift]) {
            constraints.byShift[shift] = defaultPerShiftConstraints;
          }
        });
        
        reset({
          name: employee.name,
          employeeId: employee.employeeId,
          roles: employee.roles,
          constraints: constraints,
          isActive: employee.isActive,
        });
      } else {
        reset({
          name: '',
          employeeId: '',
          roles: { noon: false, phone: false, morning: false, afternoon: false, verify1: false, verify2: false },
          constraints: {
            dailyMax: 1,
            unavailableDates: [],
            byShift: {}, // 初始為空
          },
          isActive: true,
        });
      }
      setCurrentTab('general'); // 每次打開都回到通用設定
    }
  }, [open, isEdit, employee, reset]);

  const onSubmit: SubmitHandler<EmployeeFormData> = (data) => {
    // 確保只儲存有角色的班別限制，並為沒有設定的班別提供預設值
    const finalConstraints = { ...data.constraints };
    finalConstraints.byShift = {};
    for (const shift of shifts) {
      if (data.roles[shift]) {
        if (data.constraints.byShift[shift]) {
          // 如果設定了班別限制，使用設定的值
          finalConstraints.byShift[shift] = data.constraints.byShift[shift];
        } else {
          // 如果沒有設定班別限制，提供預設值
          finalConstraints.byShift[shift] = {
            maxWeeklyShifts: 5, // 每週最多5天
            minInterval: 1,     // 最小間隔1天
            availableDays: [1, 2, 3, 4, 5], // 週一到週五
            maxConsecutiveDays: 1 // 最大連續1天
          };
        }
      }
    }
    onSave({ ...data, constraints: finalConstraints });
    onClose();
  };
  
  const handleAddUnavailableDate = () => {
    if (newUnavailableDate && !watchedUnavailableDates.includes(newUnavailableDate)) {
       setValue('constraints.unavailableDates', [...watchedUnavailableDates, newUnavailableDate]);
       setNewUnavailableDate('');
    }
  };

  const handleRemoveUnavailableDate = (dateToRemove: string) => {
    setValue('constraints.unavailableDates', watchedUnavailableDates.filter(date => date !== dateToRemove));
  };


  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: Shift | 'general') => {
    setCurrentTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? '編輯員工' : '新增員工'}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label="通用設定" value="general" />
              {availableShifts.map(shift => (
                 <Tab key={shift} label={`${shiftDisplayNames[shift]} 班次限制`} value={shift} />
              ))}
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {currentTab === 'general' && (
              <Box>
                {/* General Settings: Name, ID, Roles, Unavailable Dates, Active Status */}
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>基本資料</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Controller name="name" control={control} render={({ field }) => (
                    <TextField {...field} autoFocus label="姓名" fullWidth variant="outlined" />
                  )} />
                  <Controller name="employeeId" control={control} render={({ field }) => (
                    <TextField {...field} label="員工編號" fullWidth variant="outlined" />
                  )} />
                </Box>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>可擔任班別</Typography>
                <FormGroup row>
                  {shifts.map((shift) => (
                    <Controller key={shift} name={`roles.${shift}`} control={control} render={({ field }) => (
                      <FormControlLabel control={<Checkbox {...field} checked={!!field.value} />} label={shiftDisplayNames[shift]} />
                    )} />
                  ))}
                </FormGroup>
                
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>通用限制</Typography>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>不可排班的特定日期 (對所有班別生效)</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                   <TextField 
                     type="date" 
                     value={newUnavailableDate} 
                     onChange={(e) => setNewUnavailableDate(e.target.value)}
                     InputLabelProps={{ shrink: true }}
                     label="新增日期"
                   />
                   <Button onClick={handleAddUnavailableDate} variant="outlined">新增</Button>
                </Box>
                <List dense>
                  {watchedUnavailableDates.map((date) => (
                    <ListItem key={date} secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveUnavailableDate(date)}>
                        <DeleteIcon />
                      </IconButton>
                    }>
                      <ListItemText primary={date} />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>其他設定</Typography>
                <FormGroup>
                  <Controller name="isActive" control={control} render={({ field }) => (
                    <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label="在職狀態" />
                  )} />
                </FormGroup>
              </Box>
            )}
            
            {availableShifts.map(shift => (
              <Box key={shift} role="tabpanel" hidden={currentTab !== shift}>
                {currentTab === shift && (
                  <Box>
                    {/* Per-shift constraint fields */}
                    <Typography variant="h6" sx={{ mb: 3 }}>{`${shiftDisplayNames[shift]} 班次限制`}</Typography>
                    
                    {/* 基本限制設定 */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, alignItems: 'center', mb: 3 }}>
                      <Controller 
                        name={`constraints.byShift.${shift}.maxWeeklyShifts`} 
                        control={control} 
                        defaultValue={5}
                        render={({ field }) => (
                          <TextField 
                            {...field} 
                            label="每週最大班次" 
                            type="number" 
                            fullWidth 
                            value={field.value || 5}
                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 5)} 
                          />
                        )} 
                      />
                      <Controller 
                        name={`constraints.byShift.${shift}.minInterval`} 
                        control={control} 
                        defaultValue={1}
                        render={({ field }) => (
                          <TextField 
                            {...field} 
                            label="最小間隔天數" 
                            type="number" 
                            fullWidth 
                            value={field.value || 1}
                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} 
                          />
                        )} 
                      />
                      <Controller 
                        name={`constraints.byShift.${shift}.maxConsecutiveDays`} 
                        control={control} 
                        defaultValue={1}
                        render={({ field }) => (
                          <TextField 
                            {...field} 
                            label="最大連續排班天數" 
                            type="number" 
                            fullWidth 
                            value={field.value || 1}
                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} 
                          />
                        )} 
                      />
                    </Box>

                    {/* 可排班的星期 */}
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>可排班的星期</Typography>
                    <FormGroup row sx={{ mb: 3 }}>
                      {weekDays.map((day, index) => (
                        <Controller
                          key={day}
                          name={`constraints.byShift.${shift}.availableDays`}
                          control={control}
                          defaultValue={[1, 2, 3, 4, 5]}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={(field.value || [1, 2, 3, 4, 5]).includes(index + 1)}
                                  onChange={(e) => {
                                    const currentDays = field.value || [1, 2, 3, 4, 5];
                                    const newDays = e.target.checked
                                      ? [...currentDays, index + 1]
                                      : currentDays.filter((d: number) => d !== index + 1);
                                    field.onChange(newDays.sort());
                                  }}
                                />
                              }
                              label={day}
                            />
                          )}
                        />
                      ))}
                    </FormGroup>
                    

                  </Box>
                )}
              </Box>
            ))}
          </Box>
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

export default EmployeeForm;
