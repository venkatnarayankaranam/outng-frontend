import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { type ApprovalLevel, type ApprovalStatus } from '@/types';

interface ApprovalStagesProps {
  currentLevel: ApprovalLevel;
  floorInchargeApproval: ApprovalStatus;
  hostelInchargeApproval: ApprovalStatus;
  wardenApproval: ApprovalStatus;
}

export const ApprovalStages = ({
  floorInchargeApproval,
  hostelInchargeApproval,
  wardenApproval,
  currentLevel
}: ApprovalStagesProps) => {
  const getStageStatus = (
    approval: 'pending' | 'approved' | 'denied',
    level: string
  ) => {
    const isPending = currentLevel === level && approval === 'pending';
    const isApproved = approval === 'approved';

    return {
      icon: isApproved ? Check : isPending ? Clock : X,
      variant: isApproved ? 'success' : isPending ? 'warning' : 'default',
      text: isApproved ? 'Approved' : isPending ? 'Pending' : 'Waiting'
    };
  };

  return (
    <div className="flex flex-col gap-2">
      {[
        { name: 'Floor Incharge', status: floorInchargeApproval, level: 'floor-incharge' },
        { name: 'Hostel Incharge', status: hostelInchargeApproval, level: 'hostel-incharge' },
        { name: 'Warden', status: wardenApproval, level: 'warden' }
      ].map(({ name, status, level }) => {
        const { icon: Icon, variant, text } = getStageStatus(status, level);
        
        return (
          <div key={level} className="flex items-center gap-2">
            <Badge 
              variant={variant as any}
              className={cn(
                "w-24 flex items-center gap-1",
                currentLevel === level && "animate-pulse"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{text}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">{name}</span>
          </div>
        );
      })}
    </div>
  );
};
