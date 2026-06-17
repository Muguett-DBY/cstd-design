export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return (
    <div className="segmented">
      {options.map(([option, label]) => (
        <button type="button" key={option} className={value === option ? "active" : ""} onClick={() => onChange(option)}>
          {label}
        </button>
      ))}
    </div>
  );
}
