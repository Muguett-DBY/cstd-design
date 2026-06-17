const APP_NAME = "工作台";

export function Splash() {
  return (
    <div className="splash">
      <img src="/brand/mascot.png" alt="" className="splash-logo" />
      <div className="splash-text">
        <span>正在进入{APP_NAME}</span>
        <span className="splash-dots"><span>.</span><span>.</span><span>.</span></span>
      </div>
    </div>
  );
}
