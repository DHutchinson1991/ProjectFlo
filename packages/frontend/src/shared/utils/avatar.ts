const AVATAR_COLORS = ['#0086C0', '#A25DDC', '#FF158A', '#FDAB3D', '#00C875', '#579BFC', '#FF5AC4', '#CAB641', '#7F5347', '#66CCFF'];

/** Extract up to 2 initials from a name string */
export function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/** Deterministic avatar background color from a name string */
export function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
