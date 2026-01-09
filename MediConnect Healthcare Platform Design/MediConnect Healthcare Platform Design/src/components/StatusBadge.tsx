import { motion } from 'motion/react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'accepted' | 'completed' | 'reviewed' | 'cancelled' | 'active' | 'urgent' | 'sent' | 'pending-visit' | 'pending-review' | 'approved' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function StatusBadge({ status, size = 'md', animated = true }: StatusBadgeProps) {
  const configs = {
    pending: {
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Clock,
      label: 'Pending',
    },
    sent: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: AlertCircle,
      label: 'Sent',
    },
    'pending-visit': {
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Clock,
      label: 'Pending Visit',
    },
    'pending-review': {
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: Clock,
      label: 'Pending Review',
    },
    accepted: {
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: CheckCircle,
      label: 'Accepted',
    },
    completed: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      label: 'Completed',
    },
    reviewed: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      label: 'Reviewed',
    },
    approved: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      label: 'Approved',
    },
    cancelled: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      label: 'Cancelled',
    },
    rejected: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      label: 'Rejected',
    },
    active: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      label: 'Active',
    },
    urgent: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
      label: 'Urgent',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const config = configs[status];
  const Icon = config.icon;

  const badge = (
    <motion.span
      initial={animated ? { scale: 0, opacity: 0 } : undefined}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      whileHover={animated ? { scale: 1.05 } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <motion.div
        animate={
          animated && (status === 'pending' || status === 'urgent')
            ? {
                scale: [1, 1.2, 1],
                rotate: status === 'urgent' ? [0, 10, -10, 0] : 0,
              }
            : undefined
        }
        transition={
          animated
            ? {
                duration: status === 'urgent' ? 0.5 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      >
        <Icon className={iconSizes[size]} />
      </motion.div>
      {config.label}
    </motion.span>
  );

  return badge;
}