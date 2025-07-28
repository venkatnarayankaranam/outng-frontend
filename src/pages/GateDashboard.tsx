import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CameraQRScanner from "@/components/CameraQRScanner";
import { 
  QrCode, 
  Users, 
  LogIn, 
  LogOut, 
  Clock, 
  Search, 
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  hostelBlock: string;
  floor: string;
  roomNumber: string;
  phoneNumber: string;
}

interface GateActivity {
  id: string;
  student: Student;
  type: 'OUT' | 'IN';
  scannedAt: string;
  location: string;
  purpose: string;
  remarks: string;
  qrType: string;
}

interface GateStats {
  totalOutToday: number;
  totalInToday: number;
  currentlyOut: number;
  pendingReturn: number;
}

interface QRValidation {
  qrId: string;
  type: 'OUTGOING' | 'INCOMING';
  status: 'valid' | 'expired' | 'time_expired';
  student: Student;
  outing: {
    date: string;
    outingTime: string;
    returnTime: string;
    purpose: string;
  };
  validUntil: string;
  canScan: boolean;
}

const GateDashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [qrValidation, setQrValidation] = useState<QRValidation | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  
  const [dashboardData, setDashboardData] = useState<{
    activityLog: GateActivity[];
    stats: GateStats;
    lastUpdated: string;
  }>({
    activityLog: [],
    stats: {
      totalOutToday: 0,
      totalInToday: 0,
      currentlyOut: 0,
      pendingReturn: 0
    },
    lastUpdated: ''
  });

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/gate/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const validateQR = async (qrData: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/gate/qr/validate', { qrData });
      if (response.data.success) {
        setQrValidation(response.data.data);
        return response.data.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid QR code');
      setQrValidation(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scanQR = async (qrData: string) => {
    try {
      setIsScanning(true);
      const response = await axiosInstance.post('/gate/scan', { 
        qrData,
        location: 'Main Gate' 
      });
      
      if (response.data.success) {
        const { data } = response.data;
        toast.success(data.message);
        
        // Reset QR input and validation
        setQrInput('');
        setQrValidation(null);
        setScanMode(false);
        
        // Refresh dashboard data
        await fetchDashboardData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to scan QR code');
    } finally {
      setIsScanning(false);
    }
  };

  const handleQRInputChange = async (value: string) => {
    setQrInput(value);
    if (value.trim()) {
      await validateQR(value.trim());
    } else {
      setQrValidation(null);
    }
  };

  const handleScanConfirm = () => {
    if (qrValidation && qrValidation.canScan) {
      scanQR(qrInput);
    }
  };

  const handleCameraScanned = async (qrData: string) => {
    try {
      // Validate the scanned QR first
      const validation = await validateQR(qrData);
      if (validation && validation.canScan) {
        // Auto-scan if valid
        await scanQR(qrData);
        setCameraMode(false);
        setScanMode(false);
      } else {
        // Show validation result
        setQrInput(qrData);
        setCameraMode(false);
        // scanMode stays true to show validation
      }
    } catch (error) {
      console.error('Camera scan error:', error);
      setCameraMode(false);
      toast.error('Failed to process scanned QR code');
    }
  };

  const openCamera = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      
      setCameraError('');
      setCameraMode(true);
      setScanMode(true);
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraError('Camera permission denied. Please enable camera access.');
      toast.error('Camera permission denied. Please enable camera access.');
    }
  };

  const handleCameraClose = () => {
    setCameraMode(false);
    setCameraError('');
  };

  const getStatusColor = (type: 'OUT' | 'IN') => {
    return type === 'OUT' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading && !dashboardData.activityLog.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading gate dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Gate Dashboard</h2>
          <div className="flex gap-3">
            <Button
              onClick={() => setScanMode(!scanMode)}
              className={`flex items-center gap-2 ${
                scanMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {scanMode ? <XCircle className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
              {scanMode ? 'Close Scanner' : 'Scan QR Code'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Students Out</p>
                  <p className="text-2xl font-semibold">{dashboardData.stats.totalOutToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <LogIn className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Students In</p>
                  <p className="text-2xl font-semibold">{dashboardData.stats.totalInToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Currently Out</p>
                  <p className="text-2xl font-semibold">{dashboardData.stats.currentlyOut}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Return</p>
                  <p className="text-2xl font-semibold">{dashboardData.stats.pendingReturn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Scanner */}
        {scanMode && (
          <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Paste QR code data here or scan with camera..."
                  value={qrInput}
                  onChange={(e) => handleQRInputChange(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    console.log('Camera button clicked!');
                    openCamera(e);
                  }}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {qrValidation && (
                <div className="space-y-3">
                  <Alert className={`${
                    qrValidation.canScan 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {qrValidation.student.name} ({qrValidation.student.rollNumber})
                          </span>
                          <Badge variant={qrValidation.canScan ? "default" : "destructive"}>
                            {qrValidation.type} - {qrValidation.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Hostel: {qrValidation.student.hostelBlock} - Room {qrValidation.student.roomNumber}</p>
                          <p>Purpose: {qrValidation.outing.purpose}</p>
                          <p>Time: {qrValidation.outing.outingTime} - {qrValidation.outing.returnTime}</p>
                          {qrValidation.validUntil && (
                            <p>Valid Until: {formatDate(qrValidation.validUntil)} {formatTime(qrValidation.validUntil)}</p>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {qrValidation.canScan && (
                    <Button 
                      onClick={handleScanConfirm}
                      disabled={isScanning}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm {qrValidation.type === 'OUTGOING' ? 'Exit' : 'Entry'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        <Card className={`${theme === 'dark' ? 'bg-gray-800/90 border-gray-700' : 'glass-card'}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Gate Activity</span>
              <Badge variant="outline">
                Last Updated: {dashboardData.lastUpdated && formatTime(dashboardData.lastUpdated)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3">Time</th>
                    <th className="text-left py-3">Student</th>
                    <th className="text-left py-3">Roll Number</th>
                    <th className="text-left py-3">Hostel</th>
                    <th className="text-left py-3">Action</th>
                    <th className="text-left py-3">Purpose</th>
                    <th className="text-left py-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.activityLog.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No activity recorded today
                      </td>
                    </tr>
                  ) : (
                    dashboardData.activityLog.map((activity) => (
                      <tr key={activity.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="py-3 font-mono text-sm">
                          {formatTime(activity.scannedAt)}
                        </td>
                        <td className="py-3 font-medium">
                          {activity.student?.name || 'N/A'}
                        </td>
                        <td className="py-3">
                          {activity.student?.rollNumber || 'N/A'}
                        </td>
                        <td className="py-3">
                          {activity.student?.hostelBlock || 'N/A'} - {activity.student?.roomNumber || 'N/A'}
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(activity.type)}>
                            {activity.type === 'OUT' ? (
                              <>
                                <LogOut className="w-3 h-3 mr-1" />
                                EXIT
                              </>
                            ) : (
                              <>
                                <LogIn className="w-3 h-3 mr-1" />
                                ENTRY
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm">
                          {activity.purpose || 'N/A'}
                        </td>
                        <td className="py-3 text-sm">
                          {activity.location || 'Main Gate'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera QR Scanner */}
      <CameraQRScanner
        isVisible={cameraMode}
        onScan={handleCameraScanned}
        onClose={handleCameraClose}
      />
    </DashboardLayout>
  );
};

export default GateDashboard;