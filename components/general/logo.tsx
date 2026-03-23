import LogoIcon from '@/public/logo.svg';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export enum LogoVariants {
    ICON_ONLY = 'icon_only',
    NAME_ALONE = 'name_alone',
    NAME_BELOW = 'name_below',
    NAME_RIGHT = 'name_right'
}
export enum LogoSizes {
    SMALL = 'sm',
    MEDIUM = 'md',
    LARGE = 'lg'
}

export const LogoSizesMap: Record<LogoSizes, string> = {
    [LogoSizes.SMALL]: 'size-10',
    [LogoSizes.MEDIUM]: 'size-12',
    [LogoSizes.LARGE]: 'size-14'
};

export const LogoSizesTextMap: Record<LogoSizes, string> = {
    [LogoSizes.SMALL]: 'h3',
    [LogoSizes.MEDIUM]: 'h2',
    [LogoSizes.LARGE]: 'h1'
};

export default function Logo({
    variant = LogoVariants.NAME_RIGHT,
    size = LogoSizes.MEDIUM,
    className
}: Readonly<{
    variant?: LogoVariants;
    size?: LogoSizes;
    className?: string;
}>) {
    return (
        <div className={cn('', className)}>
            {variant !== LogoVariants.NAME_ALONE && (
                <div className="flex items-center justify-center">
                    <div className={cn(LogoSizesMap[size], 'relative')}>
                        <Image src={LogoIcon} alt="Logo de soko" fill />
                    </div>
                    {variant === LogoVariants.NAME_RIGHT && <h4 className={cn(LogoSizesTextMap[size], 'text-center w-full')}>SOKO</h4>}
                </div>
            )}
            {(variant === LogoVariants.NAME_BELOW || variant === LogoVariants.NAME_ALONE) && (
                <h4 className={cn(LogoSizesTextMap[size], 'text-center w-full')}>SOKO</h4>
            )}
        </div>
    );
}
