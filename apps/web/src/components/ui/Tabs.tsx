type TabsProps<T extends string> = {
  onChange: (value: T) => void;
  tabs: T[];
  value: T;
};

export function Tabs<T extends string>({ onChange, tabs, value }: TabsProps<T>) {
  return (
    <div className="bb-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={tab === value}
          className="bb-tabs__tab"
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
