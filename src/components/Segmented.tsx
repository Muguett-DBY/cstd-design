export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map(([option, label]) => (
        <button
          type="button"
          key={option}
          className={value === option ? "active" : ""}
          onClick={() => onChange(option)}
          role="radio"
          aria-checked={value === option}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
