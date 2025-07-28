import { type OutingRequest } from '@/types';
import { Card, CardContent, CardHeader } from './ui/card';
import { ApprovalStages } from './ApprovalStages';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { QrCode, Calendar, Clock, Download, LogOut, LogIn } from 'lucide-react';
import { useState } from 'react';

interface OutingRequestCardProps {
  request: OutingRequest;
  showApprovalStages?: boolean;
  isStudent?: boolean;
}

export function OutingRequestCard({ request, showApprovalStages = false, isStudent = false }: OutingRequestCardProps) {
  const [activeQR, setActiveQR] = useState<'outgoing' | 'incoming'>('outgoing');
  
  const isFullyApproved = request.status === 'approved' && request.currentLevel === 'completed';
  
  const requestData = request as any;
  const hasOutgoingQR = requestData.qrCode?.outgoing?.data && !requestData.qrCode?.outgoing?.isExpired;
  const hasIncomingQR = requestData.qrCode?.incoming?.data && !requestData.qrCode?.incoming?.isExpired;
  const outgoingExpired = requestData.qrCode?.outgoing?.isExpired;
  
  const hasAnyQR = hasOutgoingQR || hasIncomingQR;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">Request ID: {request.id.slice(-8)}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{new Date((request as any).date || request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant={request.status === 'approved' ? 'default' : request.status === 'denied' ? 'destructive' : 'secondary'}>
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Out: {(request as any).outTime || request.outingTime}</p>
              <p className="font-medium">In: {(request as any).inTime || request.returnTime}</p>
            </div>
          </div>
          <div>
            <p className="font-medium">Purpose:</p>
            <p className="text-muted-foreground">{(request as any).purpose}</p>
          </div>
        </div>

        {showApprovalStages && (
          <ApprovalStages
            currentLevel={request.currentLevel}
            floorInchargeApproval={request.floorInchargeApproval}
            hostelInchargeApproval={request.hostelInchargeApproval}
            wardenApproval={request.wardenApproval}
          />
        )}

        {hasAnyQR && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-400">QR Codes</span>
              </div>
              {(hasOutgoingQR || hasIncomingQR) && (
                <div className="flex gap-2">
                  {hasOutgoingQR && (
                    <Button
                      size="sm"
                      variant={activeQR === 'outgoing' ? 'default' : 'outline'}
                      onClick={() => setActiveQR('outgoing')}
                      className="h-7 px-3 text-xs"
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Exit
                    </Button>
                  )}
                  {hasIncomingQR && (
                    <Button
                      size="sm"
                      variant={activeQR === 'incoming' ? 'default' : 'outline'}
                      onClick={() => setActiveQR('incoming')}
                      className="h-7 px-3 text-xs"
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Entry
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Outgoing QR Code */}
            {activeQR === 'outgoing' && hasOutgoingQR && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img 
                    src={requestData.qrCode.outgoing.data} 
                    alt="Exit QR Code" 
                    className="w-40 h-40 border rounded-lg"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Exit QR Code
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show this QR code to exit the hostel
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated: {new Date(requestData.qrCode.outgoing.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Incoming QR Code */}
            {activeQR === 'incoming' && hasIncomingQR && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img 
                    src={requestData.qrCode.incoming.data} 
                    alt="Entry QR Code" 
                    className="w-40 h-40 border rounded-lg"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Entry QR Code
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show this QR code to enter the hostel
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generated: {new Date(requestData.qrCode.incoming.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Status Messages */}
            {outgoingExpired && !hasIncomingQR && (
              <div className="text-center">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Exit QR used. Return QR will be available 30 minutes before return time.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Waiting for QR generation */}
        {isFullyApproved && !hasAnyQR && (
          <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                QR Code will be generated shortly...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}