const APP_NAME = "工作台";

export function Brand() {
  return (
    <div className="brand">
      <img src="/brand/mascot.png" alt="" />
      <div>
        <strong>{APP_NAME}</strong>
        <span>私人空间</span>
      </div>
    </div>
  );
}
