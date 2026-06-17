interface NetworkBannerProps {
  online: boolean;
  onRetry?: () => void;
}

export function NetworkBanner({ online, onRetry }: NetworkBannerProps) {
  if (online) return null;

  return (
    <div className="network-banner" role="alert">
      <span className="network-banner-dot" />
      <span>网络已断开，部分功能暂时不可用</span>
      {onRetry && (
        <button type="button" className="network-retry" onClick={onRetry}>
          重试连接
        </button>
      )}
    </div>
  );
}
