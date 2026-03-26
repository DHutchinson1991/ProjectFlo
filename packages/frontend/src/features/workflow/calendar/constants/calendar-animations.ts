/** Shared CSS keyframe animations used across calendar view components. */
export const calendarAnimations = `
@keyframes calPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.05);
    }
}

@keyframes calShimmer {
    0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
        transform: translateX(200%) translateY(200%) rotate(45deg);
    }
}

@keyframes calSlideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes calSkeletonPulse {
    0%, 100% {
        opacity: 0.4;
    }
    50% {
        opacity: 0.15;
    }
}
`;

let injected = false;

/** Inject calendar animations into <head> once. Safe to call multiple times. */
export function injectCalendarAnimations() {
    if (injected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = calendarAnimations;
    document.head.appendChild(style);
    injected = true;
}
