import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, AlertCircle } from 'lucide-react';

interface CameraQRScannerProps {
  onScan: (qrData: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

const CameraQRScanner: React.FC<CameraQRScannerProps> = ({ onScan, onClose, isVisible }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isVisible) {
      stopScanner();
      return;
    }

    console.log('Camera scanner effect triggered, isVisible:', isVisible);

    const startScanner = async () => {
      try {
        console.log('Starting camera scanner...');
        setIsLoading(true);
        setError('');

        // Check for camera permission first
        console.log('Checking for camera...');
        const hasCamera = await QrScanner.hasCamera();
        console.log('Has camera:', hasCamera);
        if (!hasCamera) {
          throw new Error('No camera found on this device');
        }

        // Set permission to true first so video element renders
        setHasPermission(true);
        
        // Wait a bit for the video element to render
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!videoRef.current) {
          console.error('Video element not found after render');
          throw new Error('Video element not found');
        }

        // Create QR Scanner instance
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data);
            onScan(result.data);
            stopScanner();
          },
          {
            onDecodeError: (error) => {
              // Silently ignore decode errors (normal when no QR in view)
              console.debug('QR decode error:', error);
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        qrScannerRef.current = scanner;

        // Start the scanner
        await scanner.start();
        setIsLoading(false);

        console.log('Camera QR scanner started successfully');

      } catch (error: any) {
        console.error('Camera scanner error:', error);
        setError(error.message || 'Failed to start camera');
        setHasPermission(false);
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isVisible, onScan]);

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const handlePermissionRequest = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      // Request camera permission explicitly
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      
      // Restart scanner after permission granted
      window.location.reload(); // Simple solution to restart
    } catch (error: any) {
      setError('Camera permission denied. Please allow camera access and try again.');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('CameraQRScanner render:', { isVisible, error, isLoading, hasPermission });

  if (!isVisible) {
    console.log('Camera scanner not visible, returning null');
    return null;
  }

  console.log('Rendering camera scanner modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera QR Scanner
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasPermission === false && !isLoading && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Camera access is required to scan QR codes
              </p>
              <Button onClick={handlePermissionRequest} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Allow Camera Access
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Starting camera...
              </p>
            </div>
          )}

          {hasPermission && !error && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg"
                  playsInline
                  muted
                  style={{
                    objectFit: 'cover',
                    height: '300px',
                    background: '#000'
                  }}
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-sm">Loading camera...</div>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Point the camera at a QR code to scan
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraQRScanner;