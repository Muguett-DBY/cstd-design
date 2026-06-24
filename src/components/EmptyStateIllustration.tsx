interface EmptyStateIllustrationProps {
  type: "conversations" | "assets" | "search" | "error" | "loading" | "success";
  size?: number;
}

export function EmptyStateIllustration({ type, size = 120 }: EmptyStateIllustrationProps) {
  const illustrations: Record<string, React.ReactNode> = {
    conversations: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="80" height="60" rx="8" fill="var(--soft)" stroke="var(--line)" strokeWidth="2"/>
        <rect x="30" y="45" width="40" height="8" rx="4" fill="var(--line)"/>
        <rect x="30" y="58" width="55" height="6" rx="3" fill="var(--line)" opacity="0.5"/>
        <rect x="30" y="68" width="35" height="6" rx="3" fill="var(--line)" opacity="0.3"/>
        <circle cx="95" cy="85" r="12" fill="var(--accent)" opacity="0.2"/>
        <path d="M95 79v12M89 85h12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    assets: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="25" width="70" height="70" rx="8" fill="var(--soft)" stroke="var(--line)" strokeWidth="2"/>
        <circle cx="45" cy="45" r="8" fill="var(--line)" opacity="0.3"/>
        <path d="M25 70l20-15 15 10 20-18 20 18" stroke="var(--line)" strokeWidth="2" fill="none"/>
        <rect x="70" y="75" width="25" height="20" rx="4" fill="var(--accent)" opacity="0.2"/>
        <path d="M82 80v10M77 85h10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="25" fill="var(--soft)" stroke="var(--line)" strokeWidth="2"/>
        <circle cx="50" cy="50" r="15" stroke="var(--line)" strokeWidth="2" fill="none"/>
        <line x1="68" y1="68" x2="90" y2="90" stroke="var(--line)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M45 50h10M50 45v10" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    error: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="35" fill="var(--soft)" stroke="var(--danger)" strokeWidth="2"/>
        <path d="M60 45v20" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="75" r="2.5" fill="var(--danger)"/>
      </svg>
    ),
    loading: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="30" fill="var(--soft)" stroke="var(--line)" strokeWidth="2"/>
        <path d="M60 35v15M60 70v15M35 60h15M70 60h15" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        <circle cx="60" cy="60" r="20" stroke="var(--accent)" strokeWidth="2" strokeDasharray="31.4 31.4" fill="none">
          <animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    ),
    success: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="35" fill="var(--soft)" stroke="var(--accent)" strokeWidth="2"/>
        <path d="M45 60l10 10 20-20" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  };

  return (
    <div className="empty-state-illustration" aria-hidden="true">
      {illustrations[type]}
    </div>
  );
}
