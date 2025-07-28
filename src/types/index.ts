// Existing types
export interface BaseRequest {
  id: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'late-return';
  outingDate: string;
  returnDate: string;
  outingTime: string;
  returnTime: string;
  createdAt: string;
  updatedAt: string;
}

// New types for approval stages
export type ApprovalLevel = 'floor-incharge' | 'hostel-incharge' | 'warden' | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface OutingRequest extends BaseRequest {
  // Existing fields
  currentLevel: ApprovalLevel;
  floorInchargeApproval: ApprovalStatus;
  hostelInchargeApproval: ApprovalStatus;
  wardenApproval: ApprovalStatus;
}