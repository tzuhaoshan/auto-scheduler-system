import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Employee } from '../models/employee';
import { useEffect, useState } from 'react';
import EmployeeForm from '../components/EmployeeForm';
import type { EmployeeFormData } from '../components/EmployeeForm';
import { employeeService } from '../services/employeeService';

const EmployeeManagementPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleOpenForm = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  };

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    try {
      console.log('員工管理頁面收到的資料:', data);
      console.log('角色設定:', data.roles);
      
      if (selectedEmployee) {
        // 更新員工
        const updatedData = {
          name: data.name,
          employeeId: data.employeeId,
          roles: data.roles,
          constraints: data.constraints, // 確保 constraints 被儲存
          isActive: data.isActive,
        };
        console.log('更新員工資料:', updatedData);
        await employeeService.updateEmployee(selectedEmployee.id, updatedData);
      } else {
        // 新增員工
        const newEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
          name: data.name,
          employeeId: data.employeeId,
          roles: data.roles,
          constraints: data.constraints, // 確保 constraints 被儲存
          isActive: data.isActive,
        };
        console.log('新增員工資料:', newEmployee);
        await employeeService.addEmployee(newEmployee);
      }
      // 重新載入列表
      const updatedEmployees = await employeeService.getEmployees();
      console.log('更新後的員工列表:', updatedEmployees);
      setEmployees(updatedEmployees);
    } catch (error) {
      console.error('儲存員工失敗:', error);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getEmployees();
        setEmployees(data);
      } catch (error) {
        console.error("無法獲取員工資料:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2.125rem' }
          }}
        >
          員工管理
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenForm(null)}
          sx={{ 
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          新增員工
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 300, sm: 650 } }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>員工編號</TableCell>
                <TableCell>可擔任班別</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {employee.name}
                  </TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{Object.keys(employee.roles).filter(role => employee.roles[role as keyof typeof employee.roles]).join(', ')}</TableCell>
                  <TableCell>{employee.isActive ? '在職' : '離職'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label="more"
                      onClick={() => handleOpenForm(employee)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <EmployeeForm
        open={isFormOpen}
        onClose={handleCloseForm}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
      />
    </Container>
  );
};

export default EmployeeManagementPage;
