import { Link } from 'wouter';
import type { CategoryColorConfig } from '@/lib/categoryColors';

interface TagChipProps {
    id?: string;  // Tag ID for linking
    name: string;
    type?: 'CATEGORY' | 'TOPIC' | 'ENTITY';
    onClick?: () => void;
    size?: 'sm' | 'md';
    variant?: 'default' | 'outline';
    categoryColorConfig?: CategoryColorConfig; // Use centralized color config
    clickable?: boolean;  // Whether to link to tag page
}

export function TagChip({
    id,
    name,
    type = 'TOPIC',
    onClick,
    size = 'sm',
    variant = 'default',
    categoryColorConfig,
    clickable = true,  // Default to clickable
}: TagChipProps) {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    const variantClasses = {
        default: {
            CATEGORY: 'bg-primary-100 text-primary-700',
            TOPIC: 'bg-blue-100 text-blue-700',
            ENTITY: 'bg-purple-100 text-purple-700',
        },
        outline: {
            CATEGORY: 'border border-primary-300 text-primary-600',
            TOPIC: 'border border-blue-300 text-blue-600',
            ENTITY: 'border border-purple-300 text-purple-600',
        },
    };

    // Use category color config if provided, otherwise use default
    const colorClasses = categoryColorConfig
        ? `${categoryColorConfig.badgeBg} ${categoryColorConfig.badgeText}`
        : variantClasses[variant][type];

    const isClickable = clickable && id;

    const baseClasses = `
    inline-flex items-center rounded-full font-medium
    transition-all duration-200
    ${isClickable || onClick ? 'cursor-pointer hover:opacity-80' : ''}
    ${sizeClasses[size]}
    ${colorClasses}
  `;

    // Determine the link path based on type
    const linkPath = type === 'CATEGORY' ? `/category/${id}` : `/tag/${id}`;

    // If clickable and has ID, wrap in Link
    if (isClickable && !onClick) {
        return (
            <Link href={linkPath}>
                <span className={baseClasses}>
                    {name}
                </span>
            </Link>
        );
    }

    return (
        <span className={baseClasses} onClick={onClick}>
            {name}
        </span>
    );
}
